import { useEffect, useRef, useState } from 'react';

const holy_numbers = [38.0, 41.5, 39.3, 40.1, 55.8, 39.4, 36.7, 65.7, 49.0, 50.0, 61.9, 7.8, 15.0];
const length_keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'];
const length_bar_labels = ['A - B', 'B - D', 'B - F', 'E - B', 'E - D', 'E - G', 'G - F', 'G - H', 'H - F', 'D - C', 'F - C', '(H) A/B', 'A - C'];
const default_leg_colors = ['#1a85cc', '#8bd678', '#2f7062', '#8659a3'];
const default_canvas_bg = '#e8e8e8';
const default_line_width = 2.5;
const settings_storage_key = 'strandbeest_settings_v1';

// Cosmetic tilt applied by make_transform's to_screen - kept as a shared
// constant because mirror_theta (below) needs to know it too.
const scene_rotation = 0.4;

// The two legs share one physical crank pin, so both "c" points must land
// on the exact same screen pixel at every instant (and therefore trace the
// ring in the same direction - there's only ever one visible pin).
// solve_leg_mirror renders as reflect(solve_leg(theta)) through the
// oppositely-tilted to_screen.mirror (see make_transform). Working through
// that reflection and the +/-scene_rotation tilt on both sides, the input
// angle that makes the two pins coincide on screen for a given primary
// crank angle `theta` is Math.PI - theta - 2 * scene_rotation - not `theta`
// itself. (Verified numerically: the pin-coincidence error is at floating
// point noise across a full rotation.) The rest of the mirrored leg still
// comes out as a perfectly clean, undistorted reflection - solve_leg_mirror
// is a valid mirror for any input angle - just phase-shifted so its pin
// meets the primary's.
function mirror_theta(theta)
{
  return Math.PI - theta - 2 * scene_rotation;
}

function inter(p1, l1, p2, l2)
{
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);

  if (dist === 0 || dist > l1 + l2 || dist < Math.abs(l1 - l2)) return null;

  const a  = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const h_sq = l1 * l1 - a * a;
  if (h_sq < 0) return null;

  const h  = Math.sqrt(h_sq);
  const mx = p1.x + (a * dx) / dist;
  const my = p1.y + (a * dy) / dist;
  const rx = -(h * dy) / dist;
  const ry =  (h * dx) / dist;

  const r1    = { x: mx + rx, y: my + ry };
  const cross = dx * (r1.y - p1.y) - dy * (r1.x - p1.x);

  return cross < 0 ? r1 : { x: mx - rx, y: my - ry };
}

function reflect_point(p)
{
  return p && { x: -p.x, y: p.y };
}

function solve_leg(theta, lengths)
{
  const z_point = { x: 0, y: 0 };
  const y_point = { x: -lengths.a, y: lengths.l };

  const x_point = {
    x: lengths.m * Math.cos(theta),
    y: lengths.m * Math.sin(theta),
  };

  const w_point = inter(x_point, lengths.j, y_point, lengths.b);
  if (!w_point) return null;

  const v_point = inter(w_point, lengths.e, y_point, lengths.d);
  if (!v_point) return null;

  const u_point = inter(y_point, lengths.c, x_point, lengths.k);
  if (!u_point) return null;

  const t_point = inter(v_point, lengths.f, u_point, lengths.g);
  if (!t_point) return null;

  const s_point = inter(t_point, lengths.h, u_point, lengths.i);
  if (!s_point) return null;

  return { z_point, y_point, x_point, w_point, v_point, u_point, t_point, s_point };
}

function solve_leg_mirror(theta, lengths)
{
  // The mirror leg is the primary leg's pose at this same instant (same
  // theta - so the crank ring turns the same direction, in sync), reflected
  // across the vertical line through the shared crank center (z_point).
  // Reflection is an isometry: every bar-length constraint the primary leg
  // satisfies is still satisfied point-for-point after flipping, so the
  // mirrored leg comes out as an exact, undistorted horizontal mirror image
  // - never a leg solved at some other angle.
  const solved = solve_leg(theta, lengths);
  if (!solved) return null;

  return {
    z_point: reflect_point(solved.z_point),
    y_point: reflect_point(solved.y_point),
    x_point: reflect_point(solved.x_point),
    w_point: reflect_point(solved.w_point),
    v_point: reflect_point(solved.v_point),
    u_point: reflect_point(solved.u_point),
    t_point: reflect_point(solved.t_point),
    s_point: reflect_point(solved.s_point),
  };
}

function compute_traces(lengths, mirror)
{
  const foot_trace  = [];
  const foot_trace_mirror = [];
  const steps = 120;

  for (let i = 0; i < steps; i++)
  {
    const theta  = (i / steps) * Math.PI * 2;
    const points = solve_leg(theta, lengths);
    if (points) foot_trace.push(points.s_point);

    if (mirror)
    {
      const points_mirror = solve_leg_mirror(mirror_theta(theta), lengths);
      if (points_mirror) foot_trace_mirror.push(points_mirror.s_point);
    }
  }

  const crank_radius = lengths.m;

  return { foot_trace, crank_radius, foot_trace_mirror };
}

const bar_connections = [
  ['z_point', 'x_point'],
  ['x_point', 'w_point'],
  ['y_point', 'w_point'],
  ['w_point', 'v_point'],
  ['y_point', 'v_point'],
  ['y_point', 'u_point'],
  ['x_point', 'u_point'],
  ['v_point', 't_point'],
  ['u_point', 't_point'],
  ['t_point', 's_point'],
  ['u_point', 's_point'],
];

function draw_scene(ctx, canvas_width, canvas_height, points, traces, to_screen, show_labels, mirror, lengths, angle, color = '#1a85cc', show_trace = true, show_crank_circle = true, line_width = 2.5)
{
  const { foot_trace, crank_radius, foot_trace_mirror } = traces;
  const z_screen = to_screen(points.z_point);
  const r_screen = crank_radius * to_screen._scale;

  if (show_crank_circle)
  {
    ctx.strokeStyle = 'rgba(131, 140, 189, 0.64)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(z_screen.x, z_screen.y, r_screen, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (show_trace && foot_trace.length > 1)
  {
    ctx.strokeStyle = 'rgba(220, 100, 120, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const first = to_screen(foot_trace[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < foot_trace.length; i++)
    {
      const p = to_screen(foot_trace[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  if (show_trace && mirror && foot_trace_mirror.length > 1)
  {
    ctx.strokeStyle = 'rgba(220, 100, 120, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const first = to_screen.mirror(foot_trace_mirror[0]);
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < foot_trace_mirror.length; i++)
    {
      const p = to_screen.mirror(foot_trace_mirror[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  if (mirror)
  {
    const mirror_points = solve_leg_mirror(mirror_theta(angle), lengths);

    if (mirror_points)
    {
      ctx.strokeStyle = color;
      ctx.lineWidth = line_width;

      for (const [from_key, to_key] of bar_connections)
      {
        const from = mirror_points[from_key];
        const to = mirror_points[to_key];
        if (!from || !to) continue;
        const fs = to_screen.mirror(from);
        const ts = to_screen.mirror(to);

        ctx.beginPath();
        ctx.moveTo(fs.x, fs.y);
        ctx.lineTo(ts.x, ts.y);
        ctx.stroke();
      }

      for (const key of Object.keys(mirror_points))
      {
        const sp = to_screen.mirror(mirror_points[key]);
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (show_labels)
      {
        ctx.fillStyle = '#10174d';
        ctx.font = '20px monospace';
        ctx.textAlign = 'left';

        const label_map =
        {
          z_point: 'a',
          y_point: 'b',
          x_point: 'c',
          w_point: 'd',
          v_point: 'e',
          u_point: 'f',
          t_point: 'g',
          s_point: 'h',
        };
        for (const [key, label] of Object.entries(label_map))
        {
          const sp = to_screen.mirror(mirror_points[key]);
          ctx.fillText(label, sp.x, sp.y - 9)
        }
      }
    }
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = line_width;

  for (const [from_key, to_key] of bar_connections)
  {
    const from = points[from_key];
    const to   = points[to_key];
    if (!from || !to) continue;

    const fs = to_screen(from);
    const ts = to_screen(to);

    ctx.beginPath();
    ctx.moveTo(fs.x, fs.y);
    ctx.lineTo(ts.x, ts.y);
    ctx.stroke();
  }

  for (const key of Object.keys(points))
  {
    const sp = to_screen(points[key]);
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (show_labels)
  {
    ctx.fillStyle = '#10174d';
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';

    const label_map =
    {
      z_point: 'a',
      y_point: 'b',
      x_point: 'c',
      w_point: 'd',
      v_point: 'e',
      u_point: 'f',
      t_point: 'g',
      s_point: 'h',
    };
    for (const [key, label] of Object.entries(label_map))
    {
      const sp = to_screen(points[key]);
      ctx.fillText(label, sp.x, sp.y - 9)
    }
  }
}

function make_transform(lengths, canvas_width, canvas_height)
{
  let min_x = Infinity, max_x = -Infinity;
  let min_y = Infinity, max_y = -Infinity;
  const steps = 120;
  const rotation = scene_rotation;

  for (let i = 0; i < steps; i++)
  {
    const theta  = (i / steps) * Math.PI * 2;
    const points = solve_leg(theta, lengths);
    if (!points) continue;


    for (const point of Object.values(points))
      {
        const p = rotate(point, rotation);
        if (p.x < min_x) min_x = p.x;
        if (p.x > max_x) max_x = p.x;
        if (p.y < min_y) min_y = p.y;
        if (p.y > max_y) max_y = p.y;
      }
  }

  const bbox_w = max_x - min_x || 1;
  const bbox_h = max_y - min_y || 1;
  const scale  = Math.min(canvas_width / bbox_w, canvas_height / bbox_h) * 0.65;
  const origin = rotate({ x: 0, y: 0 }, rotation);
  const cx = canvas_width  / 2 - origin.x * scale;
  const cy = canvas_height / 2 + origin.y * scale;

  function to_screen(point)
  {
    const p = rotate(point, rotation);
    return { x: p.x * scale + cx, y: -p.y * scale + cy };
  }

  // The scene is drawn with a fixed cosmetic tilt (`rotation`) applied on
  // top of the leg's own geometry. Rotation and horizontal reflection don't
  // commute, so a leg that's mirrored in its own coordinate space (see
  // solve_leg_mirror) and then tilted by the same +rotation as the primary
  // leg comes out rotated by an extra 2*rotation on screen - it looks like
  // it's leaning the wrong way. Tilting the mirror leg by -rotation instead
  // exactly cancels that out, so it renders as a true horizontal mirror of
  // the primary leg as displayed, not just as modeled.
  function to_screen_mirror(point)
  {
    const p = rotate(point, -rotation);
    return { x: p.x * scale + cx, y: -p.y * scale + cy };
  }

  function rotate(point, angle)
  {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
      x: point.x * cos - point.y * sin,
      y: point.x * sin + point.y * cos,
    };
  }

  to_screen._scale = scale;
  to_screen.mirror = to_screen_mirror;

  return to_screen;
}

function PreviewCanvas({ lengths, speed, direction, show_labels, mirror, show_trace, show_crank_circle, line_width, is_playing, leg_count, leg_colors, on_ground_data })
{
  const canvas_ref      = useRef(null);
  const lengths_ref     = useRef(lengths);
  const angle_ref       = useRef(0);
  const speed_ref       = useRef(speed);
  const direction_ref   = useRef(direction);
  const show_labels_ref = useRef(show_labels);
  const mirror_ref = useRef(mirror);
  const show_trace_ref = useRef(show_trace);
  const show_crank_circle_ref = useRef(show_crank_circle);
  const line_width_ref = useRef(line_width);
  const is_playing_ref = useRef(is_playing);
  const leg_count_ref = useRef(leg_count);
  const leg_colors_ref = useRef(leg_colors);
  const on_ground_data_ref = useRef(on_ground_data);

  useEffect(() => {
    on_ground_data_ref.current = on_ground_data;
  }, [lengths]);

  useEffect(() => {
    is_playing_ref.current = is_playing;
  }, [is_playing]);

  useEffect(() => {
    leg_colors_ref.current = leg_colors;
  }, [leg_colors]);

  useEffect(() => {
    leg_count_ref.current = leg_count;
  }, [leg_count]);

  useEffect(() => {
    speed_ref.current = speed;
  }, [speed]);

  useEffect(() => {
    direction_ref.current = direction;
  }, [direction]);

  useEffect(() => {
    lengths_ref.current = lengths;
  }, [lengths]);

  useEffect(() => {
    show_labels_ref.current = show_labels;
  }, [show_labels]);

  useEffect(() => {
    mirror_ref.current = mirror;
  }, [mirror]);

  useEffect(() => {
    show_trace_ref.current = show_trace;
  }, [show_trace]);

  useEffect(() => {
    show_crank_circle_ref.current = show_crank_circle;
  }, [show_crank_circle]);

  useEffect(() => {
    line_width_ref.current = line_width;
  }, [line_width]);

  useEffect(() => {
    const canvas = canvas_ref.current;
    const ctx    = canvas.getContext('2d');
    const logical_size_ref = { current: { width: 0, height: 0 } };
    let animation_id;
    let last_time = performance.now();

    const resize_observer = new ResizeObserver((entries) => {
      const entry      = entries[0];
      const css_width  = entry.contentRect.width;
      const css_height = entry.contentRect.height;
      const dpr        = window.devicePixelRatio || 1;

      canvas.width  = css_width  * dpr;
      canvas.height = css_height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      logical_size_ref.current = { width: css_width, height: css_height };
    });

    resize_observer.observe(canvas);

    function frame(now)
    {
      const dt = (now - last_time) / 1000;
      last_time = now;

      const { width, height } = logical_size_ref.current;
      ctx.clearRect(0, 0, width, height);

      const current_lengths = lengths_ref.current;

      if (current_lengths)
      {
        if (is_playing_ref.current)
        {
        angle_ref.current -= dt * speed_ref.current * direction_ref.current;
        }

        const to_screen = make_transform(current_lengths, width, height);
        const traces    = compute_traces(current_lengths, mirror_ref.current);
        const count = leg_count_ref.current;

        for (let i = 0; i < count; i++)
        {
          const phase  = (Math.PI * 2 / count) * i;
          const theta  = angle_ref.current + phase;
          const points = solve_leg(theta, current_lengths);
          const color  = leg_colors_ref.current[i] ?? '#1a85cc';
          if (points)
          {
            draw_scene(ctx, width, height, points, traces, to_screen, show_labels_ref.current, mirror_ref.current, current_lengths, theta, color, show_trace_ref.current, show_crank_circle_ref.current, line_width_ref.current);
          }
        }

        const {foot_trace}=traces;
        if (foot_trace.length > 1 && on_ground_data_ref.current)
        {
          const max_y    = Math.max(...foot_trace.map(p => p.y));
          const ground_y = max_y;
          const threshold = (Math.max(...foot_trace.map(p => p.y)) - Math.min(...foot_trace.map(p => p.y))) * 0.05;
          const ground_pts = foot_trace.filter(p => Math.abs(p.y - ground_y) < threshold);

          let angle_deg = null;
          let distance = null;

          if (ground_pts.length >= 2)
          {
            const min_x  = Math.min(...ground_pts.map(p => p.x));
            const max_x  = Math.max(...ground_pts.map(p => p.x));
            const left   = ground_pts.find(p => p.x === min_x) ?? ground_pts[0];
            const right  = ground_pts.find(p => p.x === max_x) ?? ground_pts[ground_pts.length - 1];
            const dx     = right.x - left.x;
            const dy     = right.y - left.y;
            angle_deg    = Math.round(Math.atan2(dy, dx) * (180 / Math.PI) + 180);
            distance     = Math.round(Math.hypot(dx, dy) * 10) / 10;
          }
          const crank_deg = Math.round((((angle_ref.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI));
          on_ground_data_ref.current({ angle: angle_deg, distance: distance, crank_angle: crank_deg });
        }
      }

      animation_id = requestAnimationFrame(frame);
    }

    animation_id = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animation_id);
      resize_observer.disconnect();
    };
  }, []);

  return <canvas ref={canvas_ref} style={preview_canvas_style} />;
}

function create_default_lengths()
{
  const result = {};

  for (let i = 0; i < length_keys.length; i++)
  {
    result[length_keys[i]] = holy_numbers[i];
  }

  return result;
}

function load_saved_settings()
{
  try
  {
    const raw = localStorage.getItem(settings_storage_key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  }
  catch
  {
    return null;
  }
}

function random_length(key)
{
  // Keep the crank throw (m) and the small offset (l) in their own,
  // narrower ranges - they play a very different geometric role than the
  // main bars, and letting them roam as wide usually just produces a
  // linkage with no valid solution at most crank angles.
  if (key === 'l') return Math.round((Math.random() * 13 + 5) * 10) / 10;
  if (key === 'm') return Math.round((Math.random() * 12 + 8) * 10) / 10;
  return Math.round((Math.random() * 45 + 25) * 10) / 10;
}

export default function App()
{
  const input_refs = useRef([]);
  const file_input_ref = useRef(null);
  const [saved] = useState(load_saved_settings);

  const [lengths, set_lengths] = useState(() => saved?.lengths ?? create_default_lengths());
  const [speed, set_speed] = useState(() => saved?.speed ?? 1.2);
  const [direction, set_direction] = useState(() => (saved?.direction === -1 ? -1 : 1));
  const [show_labels, set_show_labels] = useState(() => saved?.show_labels ?? false);
  const [mirror, set_mirror] = useState(() => saved?.mirror ?? false);
  const [show_trace, set_show_trace] = useState(() => saved?.show_trace ?? true);
  const [show_crank_circle, set_show_crank_circle] = useState(() => saved?.show_crank_circle ?? true);
  const [line_width, set_line_width] = useState(() => saved?.line_width ?? default_line_width);
  const [canvas_bg, set_canvas_bg] = useState(() => saved?.canvas_bg ?? default_canvas_bg);
  const [is_playing, set_is_playing] = useState(true);
  const [leg_count, set_leg_count] = useState(() => saved?.leg_count ?? 1);
  const [leg_colors, set_leg_colors] = useState(() => saved?.leg_colors ?? default_leg_colors);
  const [ground_data, set_ground_data] = useState({ angle: null, distance: null, crank_angle: null });

  // Every customization sticks across reloads - only playback (is_playing)
  // is deliberately excluded, so the simulator always opens ready to run.
  useEffect(() => {
    try
    {
      localStorage.setItem(settings_storage_key, JSON.stringify({
        lengths, speed, direction, show_labels, mirror, show_trace,
        show_crank_circle, line_width, canvas_bg, leg_count, leg_colors,
      }));
    }
    catch
    {
      // localStorage can be unavailable (private browsing, quota) - the
      // simulator still works fine, it just won't remember settings.
    }
  }, [lengths, speed, direction, show_labels, mirror, show_trace, show_crank_circle, line_width, canvas_bg, leg_count, leg_colors]);

  // Space bar toggles play/pause, unless the user is typing/selecting.
  useEffect(() => {
    function handle_key(event)
    {
      if (event.code !== 'Space') return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      event.preventDefault();
      set_is_playing((prev) => !prev);
    }
    window.addEventListener('keydown', handle_key);
    return () => window.removeEventListener('keydown', handle_key);
  }, []);

  function handle_revert()
  {
    for (let index = 0; index < holy_numbers.length; index++)
    {
      if (input_refs.current[index])
      {
        input_refs.current[index].value = holy_numbers[index];
      }
    }
  }

  function handle_save()
  {
    const new_lengths = {};

    for (let index = 0; index < length_keys.length; index++)
    {
      const raw_value   = input_refs.current[index]?.value;
      const parsed_value = parseFloat(raw_value);

      new_lengths[length_keys[index]] = Number.isFinite(parsed_value) ? parsed_value : holy_numbers[index];
    }

    set_lengths(new_lengths);
  }

  function handle_randomize()
  {
    for (let index = 0; index < length_keys.length; index++)
    {
      if (input_refs.current[index])
      {
        input_refs.current[index].value = random_length(length_keys[index]);
      }
    }
    handle_save();
  }

  function handle_reset_all()
  {
    handle_revert();
    set_lengths(create_default_lengths());
    set_speed(1.2);
    set_direction(1);
    set_show_labels(false);
    set_mirror(false);
    set_show_trace(true);
    set_show_crank_circle(true);
    set_line_width(default_line_width);
    set_canvas_bg(default_canvas_bg);
    set_leg_count(1);
    set_leg_colors(default_leg_colors);

    try { localStorage.removeItem(settings_storage_key); } catch { /* ignore */ }
  }

  function handle_export()
  {
    const data = {
      lengths, speed, direction, show_labels, mirror, show_trace,
      show_crank_circle, line_width, canvas_bg, leg_count, leg_colors,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'strandbeest-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handle_import_file(event)
  {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try
      {
        const data = JSON.parse(reader.result);

        if (data.lengths)
        {
          for (let index = 0; index < length_keys.length; index++)
          {
            const value = data.lengths[length_keys[index]];
            if (Number.isFinite(value) && input_refs.current[index])
            {
              input_refs.current[index].value = value;
            }
          }
          handle_save();
        }

        if (Number.isFinite(data.speed)) set_speed(data.speed);
        if (data.direction === 1 || data.direction === -1) set_direction(data.direction);
        if (typeof data.show_labels === 'boolean') set_show_labels(data.show_labels);
        if (typeof data.mirror === 'boolean') set_mirror(data.mirror);
        if (typeof data.show_trace === 'boolean') set_show_trace(data.show_trace);
        if (typeof data.show_crank_circle === 'boolean') set_show_crank_circle(data.show_crank_circle);
        if (Number.isFinite(data.line_width)) set_line_width(data.line_width);
        if (typeof data.canvas_bg === 'string') set_canvas_bg(data.canvas_bg);
        if (Number.isInteger(data.leg_count)) set_leg_count(data.leg_count);
        if (Array.isArray(data.leg_colors)) set_leg_colors(data.leg_colors);
      }
      catch (err)
      {
        console.error('Could not read config file', err);
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  }

  return (
    <div style={app_shell_style}>
      <header style={header_style}>
        <div style={header_title_group_style}>
          <span style={header_title_style}>Strandbeest Leg Simulator</span>
          <span style={header_subtitle_style}>by siddharthan</span>
        </div>
        <div style={header_actions_style}>
          <button style={header_button_style} className="press-btn" onClick={handle_export}>export config</button>
          <button style={header_button_style} className="press-btn" onClick={() => file_input_ref.current?.click()}>import config</button>
          <input
            type="file"
            accept="application/json"
            ref={file_input_ref}
            onChange={handle_import_file}
            style={hidden_file_input_style}
          />
          <button style={header_button_style} className="press-btn" onClick={handle_reset_all}>reset all</button>
        </div>
      </header>

      <div style={main_row_style}>
        <div style={left_column_style}>
          <div style={{ ...panel_style, background: canvas_bg }}>
            <PreviewCanvas
              mirror={mirror}
              lengths={lengths}
              is_playing={is_playing}
              leg_colors={leg_colors}
              leg_count={leg_count}
              speed={speed}
              direction={direction}
              show_labels={show_labels}
              show_trace={show_trace}
              show_crank_circle={show_crank_circle}
              line_width={line_width}
              on_ground_data={set_ground_data}
            />
          </div>

          <div style={card_style}>
            <p style={section_title_style}>Playback</p>
            <div style={button_row_style}>
              <button style={button_style} className="press-btn" onClick={() => set_is_playing((prev) => !prev)}>
                {is_playing ? 'pause' : 'play'}
              </button>
              <button style={button_style} className="press-btn" onClick={() => set_direction((prev) => -prev)}>
                {direction === 1 ? 'direction: forward' : 'direction: reverse'}
              </button>
            </div>
            <div style={speed_strip_style}>
              <span style={speed_label_style}>speed: {speed.toFixed(1)}</span>
              <input
                type="range"
                min="0.1"
                max="12"
                step="0.1"
                value={speed}
                onChange={(event) => set_speed(Number(event.target.value))}
                style={slide_bar_styles}
              />
            </div>
          </div>
        </div>

        <div style={sidebar_style}>
          <div style={card_style}>
            <p style={section_title_style}>Legs</p>
            <label style={input_row_style}>
              <span style={input_label_style}>leg count</span>
              <select
                style={select_style}
                value={leg_count}
                onChange={(event) => set_leg_count(Number(event.target.value))}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </label>
            {Array.from({ length: leg_count }, (_, i) => (
              <div key={i} style={leg_color_row_style}>
                <span style={leg_color_label_style}>leg {i + 1}</span>
                <input
                  type="color"
                  value={leg_colors[i] ?? '#1a85cc'}
                  onChange={(event) => {
                    const new_colors = [...leg_colors];
                    new_colors[i] = event.target.value;
                    set_leg_colors(new_colors);
                  }}
                  style={leg_color_input_style}
                />
              </div>
            ))}
            <label style={toggle_row_style}>
              <input
                type="checkbox"
                checked={mirror}
                className="press-btn"
                onChange={(event) => set_mirror(event.target.checked)}
                style={checkbox_style}
              />
              mirror leg
            </label>
          </div>

          <div style={card_style}>
            <p style={section_title_style}>Display</p>
            <label style={toggle_row_style}>
              <input type="checkbox" checked={show_labels} className="press-btn" onChange={(event) => set_show_labels(event.target.checked)} style={checkbox_style} />
              label joints
            </label>
            <label style={toggle_row_style}>
              <input type="checkbox" checked={show_trace} className="press-btn" onChange={(event) => set_show_trace(event.target.checked)} style={checkbox_style} />
              show foot trace
            </label>
            <label style={toggle_row_style}>
              <input type="checkbox" checked={show_crank_circle} className="press-btn" onChange={(event) => set_show_crank_circle(event.target.checked)} style={checkbox_style} />
              show crank ring
            </label>
            <label style={input_row_style}>
              <span style={input_label_style}>background</span>
              <input type="color" value={canvas_bg} onChange={(event) => set_canvas_bg(event.target.value)} style={leg_color_input_style} />
            </label>
            <div style={speed_strip_style}>
              <span style={speed_label_style}>line width: {line_width.toFixed(1)}</span>
              <input
                type="range"
                min="1"
                max="6"
                step="0.5"
                value={line_width}
                onChange={(event) => set_line_width(Number(event.target.value))}
                style={slide_bar_styles}
              />
            </div>
          </div>

          <div style={card_style}>
            <p style={section_title_style}>Ground Data</p>
            <div style={data_row_style}>
              <span style={data_label_style}>ground angle</span>
              <span style={data_value_style}>{ground_data.angle !== null ? `${ground_data.angle}°` : '—'}</span>
            </div>
            <div style={data_row_style}>
              <span style={data_label_style}>ground distance</span>
              <span style={data_value_style}>{ground_data.distance !== null ? `${ground_data.distance}` : '—'}</span>
            </div>
            <div style={data_row_style}>
              <span style={data_label_style}>crank angle</span>
              <span style={data_value_style}>{ground_data.crank_angle !== null ? `${ground_data.crank_angle}°` : '—'}</span>
            </div>
          </div>

          <div style={{ ...card_style, gridColumn: '1 / -1' }}>
            <p
              style={section_title_style}
              title="Each field is the length of one rigid bar in Jansen's linkage, named by the two joints it connects."
            >
              Linkage Lengths
            </p>
            <div style={button_row_style}>
              <button style={button_style} className="press-btn" onClick={handle_save}>save</button>
              <button style={button_style} className="press-btn" onClick={handle_revert}>revert</button>
              <button style={button_style} className="press-btn" onClick={handle_randomize}>randomize</button>
            </div>
            <div style={lengths_grid_style}>
              {length_bar_labels.map((label, index) => (
                <label style={input_row_style} key={length_keys[index]}>
                  <span style={input_label_style}>{label}</span>
                  <input
                    style={input_style}
                    defaultValue={lengths[length_keys[index]] ?? holy_numbers[index]}
                    ref={(el) => { input_refs.current[index] = el; }}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const app_shell_style =
{
  display: 'flex',
  flexDirection: 'column',
  width: '100vw',
  height: '100vh',
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const header_style =
{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '64px',
  flexShrink: 0,
  padding: '0 20px',
  boxSizing: 'border-box',
  background: '#2b2b2b',
  borderBottom: '4px inset #818181',
};

const header_title_group_style =
{
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const header_title_style =
{
  color: '#ececec',
  fontSize: '20px',
  fontWeight: 600,
  letterSpacing: '0.3px',
};

const header_subtitle_style =
{
  color: '#9a9a9a',
  fontSize: '12px',
};

const header_actions_style =
{
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
};

const header_button_style =
{
  padding: '8px 14px',
  border: '3px outset #818181',
  background: '#383838',
  borderRadius: '1px',
  color: '#dddddd',
  fontSize: '12px',
  cursor: 'pointer',
};

const hidden_file_input_style =
{
  display: 'none',
};

const main_row_style =
{
  display: 'flex',
  flex: 1,
  minHeight: 0,
  gap: '20px',
  padding: '20px',
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const left_column_style =
{
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  width: '55%',
  minWidth: '380px',
  height: '100%',
};

const panel_style =
{
  flex: 1,
  minHeight: 0,
  border: '5px inset #adadad',
  borderRadius: '1px',
  display: 'flex',
  flexDirection: 'column',
};

const preview_canvas_style =
{
  display: 'block',
  width: '100%',
  flex: 1,
};

const sidebar_style =
{
  flex: 1,
  height: '100%',
  boxSizing: 'border-box',
  padding: '16px',
  border: '5px inset #818181',
  background: '#bdbdbd',
  borderRadius: '1px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gridAutoRows: 'min-content',
  gap: '16px',
  overflowY: 'auto',
  minWidth: 0,
};

const card_style =
{
  width: '100%',
  boxSizing: 'border-box',
  padding: '14px',
  border: '5px inset #818181',
  background: '#383838',
  borderRadius: '1px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const section_title_style =
{
  margin: 0,
  color: '#ececec',
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '0.6px',
  textTransform: 'uppercase',
  paddingBottom: '6px',
  borderBottom: '2px solid #4d4d4d',
};

const button_row_style =
{
  display: 'flex',
  gap: '8px',
};

const button_style =
{
  flex: 1,
  padding: '8px 10px',
  border: '3px outset #818181',
  background: '#383838',
  borderRadius: '1px',
  color: '#dddddd',
  fontSize: '12px',
  cursor: 'pointer',
};

const speed_strip_style =
{
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const speed_label_style =
{
  color: '#ececec',
  fontSize: '13px',
  width: '120px',
  flexShrink: 0,
};

const slide_bar_styles =
{
  flex: 1,
  accentColor: '#576066',
  cursor: 'pointer',
};

const input_row_style =
{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const input_label_style =
{
  width: '100px',
  flexShrink: 0,
  color: '#d8d8d8',
  fontSize: '13px',
};

const input_style =
{
  flex: 1,
  padding: '8px 10px',
  border: '3px inset #383838',
  background: '#111111',
  borderRadius: '1px',
  color: '#a5a8ad',
  fontSize: '14px',
  minWidth: 0,
};

const select_style =
{
  flex: 1,
  cursor: 'pointer',
  fontSize: '14px',
  padding: '8px 10px',
  border: '3px inset #383838',
  background: '#111111',
  color: '#a5a8ad',
  minWidth: 0,
};

const toggle_row_style =
{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: '#ececec',
  fontSize: '14px',
  cursor: 'pointer',
};

const checkbox_style =
{
  accentColor: '#8bd678',
  cursor: 'pointer',
  width: '16px',
  height: '16px',
  flexShrink: 0,
};

const leg_color_row_style =
{
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
};

const leg_color_label_style =
{
  color: '#ececec',
  fontSize: '14px',
  flex: 1,
};

const leg_color_input_style =
{
  width: '70px',
  height: '30px',
  border: '2px inset #383838',
  background: '#111111',
  borderRadius: '1px',
  cursor: 'pointer',
  padding: '1px 1px',
  flexShrink: 0,
};

const data_row_style =
{
  display: 'flex',
  justifyContent: 'space-between',
  gap: '10px',
};

const data_label_style =
{
  color: '#ececec',
  fontSize: '14px',
};

const data_value_style =
{
  color: '#ececec',
  fontSize: '14px',
};

const lengths_grid_style =
{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '8px 16px',
};
