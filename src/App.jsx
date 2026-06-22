export default function App()
{
  return (
    <div style={page_style}>
      <div style={panel_wrapper_style}>
        <div style={panel_style}>
        </div>
      </div>

      <div style={inputs_panel_style}>

        <label style={inputs_rows_style}>
          <span style={inputs_labeling_style}>A - B</span>
          <input style={def_inputs_style} />
        </label>

        <label style={inputs_rows_style}>
          <span style={inputs_labeling_style}>B - C</span>
          <input style={def_inputs_style} />
        </label>

        <label style={inputs_rows_style}>
          <span style={inputs_labeling_style}>C - D</span>
          <input style={def_inputs_style} />
        </label>

        <label style={inputs_rows_style}>
          <span style={inputs_labeling_style}>D - E</span>
          <input style={def_inputs_style} />
        </label>

        <label style={inputs_rows_style}>
          <span style={inputs_labeling_style}>E - F</span>
          <input style={def_inputs_style} />
        </label>

        <label style={inputs_rows_style}>
          <span style={inputs_labeling_style}>F - G</span>
          <input style={def_inputs_style} />
        </label>

        <label style={inputs_rows_style}>
          <span style={inputs_labeling_style}>G - H</span>
          <input style={def_inputs_style} />
        </label>

      </div>
    </div>
  );
}

const page_style = 
{
  display: 'flex',
  width: '90vw',
  height: '90vh',
  overflow: 'hidden',
};

const panel_wrapper_style = 
{
  padding: '20px',
  boxSizing: 'border-box',
};

const panel_style = 
{
  width: 'min(calc(90vh - 40px), 50vw)',
  height: 'min(calc(90vh - 40px), 50vw)',
  background: '#ffffff',
  border: '3px solid #000000',
  borderRadius: '1px',
};

const inputs_panel_style = 
{
  width: '260px',
  height: 'min(calc(90vh - 40px), 50vw)',
  margin: '20px 20px 20px 0',
  boxSizing: 'border-box',
  padding: '16px',
  border: '3px inset #000000',
  background: '#8f8f8f',
  borderRadius: '1px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  overflowY: 'auto',
};

const inputs_rows_style = 
{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const inputs_labeling_style = 
{
  width: '40px',
  color: '#000000',
  fontFamily: '"Instrument Sans", system-ui, "Segoe UI", Roboto, sans-serif',
  fontSize: '13px',
};

const def_inputs_style = 
{
  flex: 1,
  padding: '8px 10px',
  borderRadius: '1px',
  border: '3px inset #a0a0a0',
  background: '#16171d',
  color: '#e4e7eb',
  fontSize: '14px',
  minWidth: 0,
};