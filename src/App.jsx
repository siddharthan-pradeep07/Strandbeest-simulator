import { useRef } from 'react';

const holy_numbers = [38.0, 41.5, 39.3, 40.1, 55.8, 39.4, 36.7, 65.7, 49.0, 50.0, 61.9, 7.8, 15.0];

export default function App()
{
  const input_refs = useRef([]);

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

  return (
    <div style={page_style}>
      <div style={panel_style}>
      </div>
      <div style={right_panel_style}>
        <div style={inputs_panel_style}>
          <p>Controls (Measurements)</p>
          <div style={button_row_style}>
            <button style={button_style}>save</button>
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