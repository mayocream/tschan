import React from 'react'

function LayersPanel() {
  return (
    <aside className='sidebar w-48 -translate-x-full transform bg-white p-4 transition-transform duration-150 ease-in md:translate-x-0 md:shadow-md'>
      <div className='my-4 w-full border-b-4 border-indigo-100 text-center'>
        <span className='font-mono text-xl font-bold tracking-widest'>
          {' '}
          <span className='text-indigo-600'>HELLO</span> DEV{' '}
        </span>
      </div>
      <div className='my-4'></div>
    </aside>
  )
}

export default LayersPanel
