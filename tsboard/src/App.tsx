import ImageWindow from './components/ImageWindow'
import LayersPanel from './components/LayersPanel'

function App() {
  return (
    <div className='flex bg-gray-900 h-screen w-screen'>
      <main className='flex flex-col grow overflow-auto min-h-0 min-w-0'>
        <ImageWindow />
      </main>
      <aside>
        <LayersPanel />
      </aside>
    </div>
  )
}

export default App
