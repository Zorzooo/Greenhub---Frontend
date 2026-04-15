import Navigation from '../components/Navigation'
import DemoOverlay from '../components/DemoOverlay'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoOverlay />
      <Navigation />
      {children}
    </>
  )
}