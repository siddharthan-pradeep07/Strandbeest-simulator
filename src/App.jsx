import { useEffect, useRef, useState } from 'react';

const holy_numbers = [38.0, 41.5, 39.3, 40.1, 55.8, 39.4, 36.7, 65.7, 49.0, 50.0, 61.9, 7.8, 15.0];
const length_keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'];
//const mirror_b_offset = -30.0;
const mirror_b_y_offset = -20;

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

function inter_mirror(p1,l1,p2,l2)
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

  return cross < 0 ? { x: mx - rx, y: my - ry } : r1;
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

//--------------------------------------------------------------------------------

// function solve_leg_mirror(theta, lengths)
// {
//   const z_point = { x: 2 * lengths.a, y: 0 };
//   const y_point = { x: lengths.a, y: lengths.l };

//   const x_point = {
//     x: z_point.x + lengths.m * Math.cos(theta),
//     y: z_point.y + lengths.m * Math.sin(theta),
//   };

//   const w_point = inter_mirror(x_point, lengths.j, y_point, lengths.b);
//   if (!w_point) return null;

//   const v_point = inter_mirror(w_point, lengths.e, y_point, lengths.d);
//   if (!v_point) return null;

//   const u_point = inter_mirror(y_point, lengths.c, x_point, lengths.k);
//   if (!u_point) return null;

//   const t_point = inter_mirror(v_point, lengths.f, u_point, lengths.g);
//   if (!t_point) return null;

//   const s_point = inter_mirror(t_point, lengths.h, u_point, lengths.i);
//   if (!s_point) return null;

//   return { z_point, y_point, x_point, w_point, v_point, u_point, t_point, s_point };
// }

//-----------------------------------------------------------------------------------------

// function solve_leg_mirror(theta, lengths)
// {
//   const raw = solve_leg(Math.PI - theta, lengths);
//   if (!raw) return null;

//   const flipped = {};

//   for (const [key, point] of Object.entries(raw))
//   {
//     flipped[key] = {x: -point.x, y: point.y,};
//   }
//   flipped.y_point =
//   {
//     x: flipped.y_point.x,
//     y: flipped.y_point.y + mirror_b_y_offset,
//   };

//   return flipped;
// }

//-----------------------------------------------------------------------------------------

function solve_leg_mirror(theta, lengths)
{
  const z_point =
  {
    x: 0,
    y: 0,
  };

  const y_point =
  {
    x: lengths.a,
    y: lengths.l,
  };

  const x_point =
  {
    x: lengths.m * Math.cos(theta),
    y: lengths.m * Math.sin(theta),
  };

  const w_point = inter_mirror(x_point, lengths.j, y_point, lengths.b);
  if (!w_point) return null;

  const v_point = inter_mirror(w_point, lengths.e, y_point, lengths.d);
  if (!v_point) return null;

  const u_point = inter_mirror(y_point, lengths.c, x_point, lengths.k);
  if (!u_point) return null;

  const t_point = inter_mirror(v_point, lengths.f, u_point, lengths.g);
  if (!t_point) return null;

  const s_point = inter_mirror(t_point, lengths.h, u_point, lengths.i);
  if (!s_point) return null;

  return {
    z_point,
    y_point,
    x_point,
    w_point,
    v_point,
    u_point,
    t_point,
    s_point,
  };
}

//-----------------------------------------------------------------------------------------

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
      const points_mirror = solve_leg_mirror(theta, lengths);
      if (points_mirror) foot_trace_mirror.push
      (
        points_mirror.s_point
      );
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

function draw_scene(ctx, canvas_width, canvas_height, points, traces, to_screen, show_labels, mirror, lengths, angle, color ='#1a85cc')
{
  const { foot_trace, crank_radius, foot_trace_mirror } = traces;
  const z_screen = to_screen(points.z_point);
  const r_screen = crank_radius * to_screen._scale;

  ctx.strokeStyle = 'rgba(131, 140, 189, 0.64)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(z_screen.x, z_screen.y, r_screen, 0, Math.PI * 2);
  ctx.stroke();

  if (foot_trace.length > 1)
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

  if (mirror && foot_trace_mirror.length > 1)
  {
    ctx.strokeStyle = 'rgba(220, 100, 120, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const first = to_screen(foot_trace_mirror[0]);
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < foot_trace_mirror.length; i++)
    {
      const p = to_screen(foot_trace_mirror[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  if (mirror)
  {
    const mirror_points = solve_leg_mirror(angle,lengths);

    if (mirror_points)
    {   
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      for (const [from_key, to_key] of bar_connections)
      {
        const from = mirror_points[from_key];
        const to = mirror_points[to_key];
        if (!from || !to) continue;
        const fs = to_screen(from);
        const ts = to_screen(to);

        ctx.beginPath();
        ctx.moveTo(fs.x, fs.y);
        ctx.lineTo(ts.x, ts.y);
        ctx.stroke();
      }

      for (const key of Object.keys(mirror_points))
      {
        const sp = to_screen(mirror_points[key]);
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;

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
  const rotation = 0.4;

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

  return to_screen;
}

// ADD
function PreviewCanvas({ lengths, speed, show_labels, mirror, is_playing, leg_count, leg_colors })
{
  const canvas_ref      = useRef(null);
  const lengths_ref     = useRef(lengths);
  const angle_ref       = useRef(0);
  const speed_ref       = useRef(speed);
  const show_labels_ref = useRef(show_labels);
  const mirror_ref = useRef(mirror);
  const is_playing_ref = useRef(is_playing);
  const leg_count_ref = useRef(leg_count);
  const leg_colors_ref = useRef(leg_colors);

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
    lengths_ref.current = lengths;
  }, [lengths]);

  useEffect(() => {
    show_labels_ref.current = show_labels;
  }, [show_labels]);

  useEffect(() => {
    mirror_ref.current = mirror;
  }, [mirror]);

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
        angle_ref.current -= dt * speed_ref.current;
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
            draw_scene(ctx, width, height, points, traces, to_screen, show_labels_ref.current && i === 0, mirror_ref.current, current_lengths, theta, color);
          }
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

export default function App()
{
  const input_refs = useRef([]);
  const [lengths, set_lengths] = useState(create_default_lengths);
  const [speed, set_speed] = useState(1.2);
  const [show_labels, set_show_labels] = useState(false);
  const [mirror, set_mirror] = useState(false);
  const [is_playing, set_is_playing] = useState(true);
  const [leg_count, set_leg_count] = useState(1);
  const [leg_colors, set_leg_colors] = useState(['#1a85cc', '#8bd678', '#2f7062', '#8659a3']);

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

  return (
    <div style={page_style}>
      <div style={left_column_style}>
        <div style={panel_style}>
          <PreviewCanvas mirror={mirror} lengths={lengths} is_playing={is_playing} leg_colors={leg_colors} leg_count={leg_count} speed={speed} show_labels={show_labels} />
        </div>
        <div style={controls_card_style}>
          <div style={speed_strip_style}>
            <span style={speed_label_style}>
              Speed: {speed.toFixed(1)}
            </span>
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

      <div style={right_panel_style}>
        <div style={inputs_panel_style}>
          <p>Controls (Measurements)</p>
          {/* <button style= {play_and_pause_bottun_style} className ="press-btn" onClick ={() => set_is_playing((prev) => !prev)}>play \ pause</button> */}

          <div style={button_row_style}>
            <button style={button_style} className="press-btn" onClick={handle_save}>save</button>
            <button style={button_style} className="press-btn" onClick={handle_revert}>revert</button>
          </div>
          <label style={input_row_style}>
            <span style={input_label_style}>A - B</span>
            <input style={input_style} defaultValue={holy_numbers[0]} ref={(el) => { input_refs.current[0] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>B - D</span>
            <input style={input_style} defaultValue={holy_numbers[1]} ref={(el) => { input_refs.current[1] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>B - F</span>
            <input style={input_style} defaultValue={holy_numbers[2]} ref={(el) => { input_refs.current[2] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>E - B</span>
            <input style={input_style} defaultValue={holy_numbers[3]} ref={(el) => { input_refs.current[3] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>E - D</span>
            <input style={input_style} defaultValue={holy_numbers[4]} ref={(el) => { input_refs.current[4] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>E - G</span>
            <input style={input_style} defaultValue={holy_numbers[5]} ref={(el) => { input_refs.current[5] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>G - F</span>
            <input style={input_style} defaultValue={holy_numbers[6]} ref={(el) => { input_refs.current[6] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>G - H</span>
            <input style={input_style} defaultValue={holy_numbers[7]} ref={(el) => { input_refs.current[7] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>H - F</span>
            <input style={input_style} defaultValue={holy_numbers[8]} ref={(el) => { input_refs.current[8] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>D - C</span>
            <input style={input_style} defaultValue={holy_numbers[9]} ref={(el) => { input_refs.current[9] = el; }} />
          </label>
          <label style={input_row_style}> 
            <span style={input_label_style}>F - C</span>
            <input style={input_style} defaultValue={holy_numbers[10]}  ref={(el) => { input_refs.current[10] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>(H) A/B</span>
            <input style={input_style} defaultValue={holy_numbers[11]} ref={(el) => { input_refs.current[11] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>A - C</span>
            <input style={input_style} defaultValue={holy_numbers[12]} ref={(el) => { input_refs.current[12] = el; }} />
          </label>
        </div>
        <div style={top_row_style}>
          <div style={paly_pause_panel_style}>
            <button style={play_and_pause_bottun_style} className="press-btn" onClick={() => set_is_playing((prev) => !prev)}>play / pause</button>
          </div>

          <div style={leg_count_panel_style}>
            <span style={input_label_style}>number of legs</span>
            <select
              style={leg_count_select_style}
              value={leg_count}
              onChange={(event) => set_leg_count(Number(event.target.value))}>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
          </div>
          {Array.from({ length: leg_count }, (_, i) => (
            <div key={i} style={leg_color_row_style}>
              <span style={leg_color_label_style}>leg: {i + 1}</span>
              <input
                type="color"
                value = {leg_colors[i]}
                onChange={(event) => {
                  const new_colors = [...leg_colors];
                  new_colors[i] = event.target.value;
                  set_leg_colors(new_colors);
                }}
                style={leg_color_input_style}
              />
            </div>
          ))}
        </div>
        <div style={top_row_style}>
          <div style={labels_strip_style}>
            <label style={show_labels_label_style}>
              <input type="checkbox" checked={mirror} className="press-btn" onChange={(event) => set_mirror(event.target.checked)}
              style={show_labels_checkbox_style} />
              mirror leg
            </label>
          </div>
          <div style={labels_strip_style}>
            <label style={show_labels_label_style}>
              <input type="checkbox" checked={show_labels} className="press-btn" onChange={(event) => set_show_labels(event.target.checked)}
              style={show_labels_checkbox_style} />
              label joints
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

const page_style =
{
  display: 'flex',
  width: '100vw',
  height: '100vh',
  boxSizing: 'border-box',
  padding: '20px',
  gap: '20px',
  overflow: 'hidden',
};

const panel_style =
{
  width: 'calc(100vh - 40px)',
  height: 'calc(80vh - 40px)',
  flexShrink: 0,
  border: '5px inset #adadad',
  background: '#e8e8e8',
  borderRadius: '1px',
  display: 'flex',
  flexDirection: 'column',
};

const left_column_style =
{
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  width: 'calc(100vh - 40px)',
  flexShrink: 0,
};

const controls_card_style = 
{
  width: '100%',
  border: '5px inset #adadad',
  background: '#bdbdbd',
  borderRadius: '1px',
  display: 'flex',
  flexDirection: 'column',
}

const speed_strip_style =
{
  height: '54px',
  borderBottom: '3px inset #adadad',
  display:'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '6px 12px',
  boxSizing: 'border-box',
};

const labels_strip_style =
{
  height: '30px',
  display: 'flex',
  alignItems: 'center',
  padding: '5px 10px',
  boxSizing: 'border-box',
  height: '54px',
  border: '3px inset #494949',
};

const preview_canvas_style =
{
  display: 'block',
  width: '100%',
  flex: 1,
};

const right_panel_style =
{
  flex: 1,
  height: 'calc(100vh - 40px)',
  boxSizing: 'border-box',
  padding: '16px',
  border: '5px inset #818181',
  background: '#bdbdbd',
  borderRadius: '1px',
  display: 'flex',
  flexDirection: 'row',
  gap: '16px',
  overflowY: 'scroll',
  minWidth: 0,
  alignItems: 'flex-start',
};

const inputs_panel_style =
{
  width: '300px',
  //height: '98%',
  boxSizing: 'border-box',
  padding: '16px',
  border: '5px inset #818181',
  background: '#383838',
  borderRadius: '1px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const button_row_style =
{
  display: 'flex',
  gap: '8px',
  paddingBottom: '6px',
};

const button_style =
{
  flex: 1,
  height: '90%',
  padding: '8px 10px',
  border: '3px outset #818181',
  background: '#383838',
  borderRadius: '1px',
  color: '#dddddd',
  fontSize: '12px',
  cursor: 'pointer',
};

const play_and_pause_bottun_style =
{
  width: '100%',
  padding: '8px 10px',
  border: '3px outset #818181', // should be border: '3px inset #818181'
  background: '#383838',
  borderRadius: '1px',
  color: '#dddddd',
  fontSize: '12px',
  cursor: 'pointer',
}

const input_row_style =
{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const input_label_style =
{
  width: '100px',
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

// const speed_panel_style =
// {
//   height: '54px',
//   borderTop: '3px inset #adadad',
//   background: '#bdbdbd',
//   display: 'flex',
//   alignItems: 'center',
//   gap: '10px',
//   padding: '6px 12px',
//   boxSizing: 'border-box',
// };

const speed_label_style =
{
  color: '#333333',
  fontSize: '13px',
  width: '80px',
};

const slide_bar_styles = 
{
  flex: 1,
  accentColor: '#576066',
  cursor: 'pointer',
};

const show_labels_label_style =
{
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  color: '#333333',
  fontSize: '18px',
  cursor: 'pointer',
  //width: '25%',
};

const show_labels_checkbox_style =
{
  accentColor: '#2b2a3f',
  cursor: 'pointer',
  width: '16px',
  height: '16px',
};

const leg_count_panel_style =
{
  display: 'flex',
  alignItems: 'center',
  gap: '70px',
  padding: '10px',
  width: '269px',
  border: '5px inset #818181',
  background: '#383838',
  borderRadius: '1px',
};

const leg_count_select_style =
{
  cursor: 'pointer',
  fontSize: '14px',
  width: '100px',
  padding: '8px 10px',
  border: '3px inset #383838',
  background: '#111111',
  color: '#a5a8ad',
};

const paly_pause_panel_style =
{
  width: '300px',
  padding: '10px',
  border: '5px inset #818181',
  background: '#383838',
  borderRadius: '1px',
  boxSizing: 'border-box',
};

const top_row_style =
{
  display: 'flex',
  gap: '10px',
  flexDirection: 'column',
  alignItems: 'flex-start',
};

const leg_color_row_style =
{
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  paddingTop: '1px',
  width: '100%',
  border: '3px inset #818181',
  background: '#383838',
};

const leg_color_label_style =
{
  color: '#ececec',
  fontSize: '15px',
  flex: 4, 
  paddingLeft: '10px',
  paddingBottom: '5px',
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
};