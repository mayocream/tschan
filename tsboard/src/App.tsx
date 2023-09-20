import ImageWindow from './components/ImageWindow'
import LayersPanel from './components/LayersPanel'

function App() {
  return (
    <div className='flex bg-gray-900 h-screen w-screen'>
      <main className='grow'>
        <ImageWindow />
      </main>
      <aside>
        <LayersPanel />
      </aside>
    </div>
  )
}

export default App
