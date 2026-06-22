export default function App()
{
  return (
    <div style={page_style}>
      <div style={panel_wrapper_style}>
        <div style={panel_style}>
        </div>
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
  background: '#b88989',
  border: '3px solid #000000',
  borderRadius: '1px',
};