import { useEffect, useRef, useState } from 'react';

const holy_numbers = [38.0, 41.5, 39.3, 40.1, 55.8, 39.4, 36.7, 65.7, 49.0, 50.0, 61.9, 7.8, 15.0];
const length_keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'];

function circle_intersection(center_a, radius_a, center_b, radius_b)
{
  const dx = center_b.x - center_a.x;
  const dy = center_b.y - center_a.y;
  const dist = Math.hypot(dx, dy);

  if (dist > radius_a + radius_b || dist < Math.abs(radius_a - radius_b) || dist === 0)
  {
    return null;
  }

  const a_offset = (radius_a * radius_a - radius_b * radius_b + dist * dist) / (2 * dist);
  const h_sq = radius_a * radius_a - a_offset * a_offset;

  if (h_sq < 0)
  {
    return null;
  }

  const h_offset = Math.sqrt(h_sq);
  const mid_x = center_a.x + (a_offset * dx) / dist;
  const mid_y = center_a.y + (a_offset * dy) / dist;

  return {
    x: mid_x - h_offset * (dy / dist),
    y: mid_y + h_offset * (dx / dist),
  };
}

function solve_leg(theta, lengths)
{
  const z_point = { x: 0, y: 0 };
  const ground_y = lengths.l;
  const y_point = 
  {
    x: -lengths.a,
    y: ground_y
  };

  const x_point = {
    x: lengths.m * Math.cos(theta),
    y: lengths.m * Math.sin(theta),
  };

  const w_point = circle_intersection(x_point, lengths.j, y_point, lengths.b);
  if (!w_point) return null;

  const v_point = circle_intersection(w_point, lengths.e, y_point, lengths.d);
  if (!v_point) return null;

  const u_point = circle_intersection(y_point, lengths.c, x_point, lengths.k);
  if (!u_point) return null;

  const t_point = circle_intersection(v_point, lengths.f, u_point, lengths.g);
  if (!t_point) return null;

  const s_point = circle_intersection(t_point, lengths.h, u_point, lengths.i);
  if (!s_point) return null;

  return { z_point, y_point, x_point, w_point, v_point, u_point, t_point, s_point };
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

function draw_leg(ctx, canvas_width, canvas_height, points)
{
  const all_points = Object.values(points);
  const xs = all_points.map((point) => point.x);
  const ys = all_points.map((point) => point.y);

  const min_x = Math.min(...xs);
  const max_x = Math.max(...xs);
  const min_y = Math.min(...ys);
  const max_y = Math.max(...ys);

  const bbox_width = max_x - min_x || 1;
  const bbox_height = max_y - min_y || 1;
  const center_x = (min_x + max_x) / 2;
  const center_y = (min_y + max_y) / 2;

  const scale = Math.min(canvas_width / bbox_width, canvas_height / bbox_height) * 0.6;

  const to_world = (point) => ({
    x: canvas_width / 2 + (point.x - center_x) * scale,
    y: canvas_height / 2 + (point.y - center_y) * scale,
  });

  ctx.strokeStyle = '#1d2630';
  ctx.lineWidth = 3;

  for (const [from_key, to_key] of bar_connections)
  {
    const from = points[from_key];
    const to = points[to_key];
    if (!from || !to) continue;
    const from_world = to_world(from);
    const to_world_point = to_world(to);

    ctx.beginPath();
    ctx.moveTo(from_world.x, from_world.y);
    ctx.lineTo(to_world_point.x, to_world_point.y);
    ctx.stroke();
  }

  for (const key of Object.keys(points))
  {
    const world_point = to_world(points[key]);

    ctx.fillStyle = '#1d2630';
    ctx.beginPath();
    ctx.arc(world_point.x, world_point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function PreviewCanvas({ lengths })
{
  const canvas_ref = useRef(null);
  const lengths_ref = useRef(lengths);
  const angle_ref = useRef(0);
  const prev_points_ref = useRef({});

  useEffect(() => {
    lengths_ref.current = lengths;
  }, [lengths]);

  useEffect(() => {
    const canvas = canvas_ref.current;
    const ctx = canvas.getContext('2d');
    const logical_size_ref = { current: { width: 0, height: 0 } };
    let animation_id;
    let last_time = performance.now();

    const resize_observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const css_width = entry.contentRect.width;
      const css_height = entry.contentRect.height;
      const device_pixel_ratio = window.devicePixelRatio || 1;

      canvas.width = css_width * device_pixel_ratio;
      canvas.height = css_height * device_pixel_ratio;
      ctx.setTransform(device_pixel_ratio, 0, 0, device_pixel_ratio, 0, 0);

      logical_size_ref.current = { width: css_width, height: css_height };
    });

    resize_observer.observe(canvas);

    function chooseStable(curr, prev)
    {
      if (!curr) return prev || { x: 0, y: 0 };
      if (!prev) return curr;
      const d1 = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      const d2 = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      return d1 <= d2 ? curr : prev;
    }

    function frame(now)
    {
      const dt = (now - last_time) / 1000;
      last_time = now;

      const { width, height } = logical_size_ref.current;
      ctx.clearRect(0, 0, width, height);

      const current_lengths = lengths_ref.current;

      if (current_lengths)
      {
        angle_ref.current += dt * 1.2;

        const raw_points = solve_leg(angle_ref.current, current_lengths);
        if (!raw_points) return;
        const prev = prev_points_ref.current;
        const points = 
        {
          ...raw_points,
          w_point: chooseStable(raw_points.w_point, prev.w_point),
          v_point: chooseStable(raw_points.v_point, prev.v_point),
          u_point: chooseStable(raw_points.u_point, prev.u_point),
          t_point: chooseStable(raw_points.t_point, prev.t_point),
          s_point: chooseStable(raw_points.s_point, prev.s_point),
        };

        prev_points_ref.current = points;

        if (points)
        {
          draw_leg(ctx, width, height, points);
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

export default function App()
{
  const input_refs = useRef([]);
  const [lengths, set_lengths] = useState(null);

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
      const raw_value = input_refs.current[index]?.value;
      const parsed_value = parseFloat(raw_value);

      new_lengths[length_keys[index]] = Number.isFinite(parsed_value) ? parsed_value : holy_numbers[index];
    }

    set_lengths(new_lengths);
  }

  return (
    <div style={page_style}>
      <div style={panel_style}>
        <PreviewCanvas lengths={lengths} />
      </div>
      <div style={right_panel_style}>
        <div style={inputs_panel_style}>
          <p>Controls (Measurements)</p>
          <div style={button_row_style}>
            <button style={button_style} onClick={handle_save}>save</button>
            <button style={button_style} onClick={handle_revert}>revert to original numbers</button>
          </div>
          <label style={input_row_style}>
            <span style={input_label_style}>A - B</span>
            <input style={input_style} ref={(el) => { input_refs.current[0] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>B - C</span>
            <input style={input_style} ref={(el) => { input_refs.current[1] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>C - D</span>
            <input style={input_style} ref={(el) => { input_refs.current[2] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>D - E</span>
            <input style={input_style} ref={(el) => { input_refs.current[3] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>E - F</span>
            <input style={input_style} ref={(el) => { input_refs.current[4] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>F - G</span>
            <input style={input_style} ref={(el) => { input_refs.current[5] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>G - H</span>
            <input style={input_style} ref={(el) => { input_refs.current[6] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>H - I</span>
            <input style={input_style} ref={(el) => { input_refs.current[7] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>I - J</span>
            <input style={input_style} ref={(el) => { input_refs.current[8] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>J - K</span>
            <input style={input_style} ref={(el) => { input_refs.current[9] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>K - L</span>
            <input style={input_style} ref={(el) => { input_refs.current[10] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>L - M</span>
            <input style={input_style} ref={(el) => { input_refs.current[11] = el; }} />
          </label>
          <label style={input_row_style}>
            <span style={input_label_style}>M - N</span>
            <input style={input_style} ref={(el) => { input_refs.current[12] = el; }} />
          </label>
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
  width: 'calc(80vh - 40px)',
  height: 'calc(80vh - 40px)',
  flexShrink: 0,
  border: '5px inset #adadad',
  background: '#ffffff',
  borderRadius: '1px',
};

const preview_canvas_style = 
{
  display: 'block',
  width: '100%',
  height: '100%',
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
  flexDirection: 'column',
  gap: '16px',
  overflowY: 'auto',
  minWidth: 0,
};

const inputs_panel_style = 
{
  width: '300px',
  height: '98%',
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

const input_row_style = 
{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const input_label_style = 
{
  width: '48px',
  color: '#d8d8d8',
  fontSize: '13px',
};

const input_style = 
{
  flex: 1,
  padding: '8px 10px',
  borderRadius: '8px',
  border: '3px inset #383838',
  background: '#111111',
  borderRadius: '1px',
  color: '#a5a8ad',
  fontSize: '14px',
  minWidth: 0,
};