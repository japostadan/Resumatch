import { createFileRoute } from '@tanstack/react-router'
import { Home } from '../components/home/Home'

// File name determines the URL path:  index.tsx → "/"
export const Route = createFileRoute('/')({
  component: Home,
})
