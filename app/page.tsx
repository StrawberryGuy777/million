'use client'

import Image from 'next/image'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Crown, Trophy, ScrollText, ExternalLink, ArrowDownCircle, Bot, Zap, Rocket } from 'lucide-react'
import { toast, Toaster } from "sonner";
import { FaSquareXTwitter } from "react-icons/fa6";
import { GiReceiveMoney } from "react-icons/gi";

interface Token {
  name: string
  symbol: string | null
  amount: number
  mint: string
}

interface ApiResponse {
  totalTokens: number
  tokens: Token[]
}

interface FloatingToken {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  image: string
  rotation: number
  rotationSpeed: number
  scale: number
  targetScale: number
  opacity: number
}

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: -9999, y: -9999 })
  const tokenListRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [floatingTokens, setFloatingTokens] = useState<FloatingToken[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  const tokenLogos = [
    'bananan.jpeg', 'bert.png', 'chill.jpeg', 'daddy.jpeg', 'dmaga.jpeg',
    'fwog.png', 'gork.jpeg', 'house.jpeg', 'kek.jpeg', 'moodeng.png',
    'moonpig.png', 'pepeai.jpeg', 'pnut.jpeg', 'prope.jpeg', 'rizz.jpeg',
    'sigma.png', 'titcoin.jpeg', 'troll.png', 'unico.jpeg', 'would.jpeg'
  ]

  // Initialize floating tokens
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    
    const initialTokens: FloatingToken[] = tokenLogos.slice(0, 15).map((logo, index) => {
      const radius = 25 + Math.random() * 15 // 25-40px radius
      return {
        id: `token-${index}`,
        x: radius + Math.random() * (containerRect.width - radius * 2),
        y: radius + Math.random() * (containerRect.height - radius * 2),
        vx: (Math.random() - 0.5) * 2, // Start with a bit less velocity
        vy: (Math.random() - 0.5) * 2,
        radius: radius,
        image: logo,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.5, // Slower rotation
        scale: 1,
        targetScale: 1,
        opacity: 0.8 + Math.random() * 0.2
      }
    })

    setFloatingTokens(initialTokens)
  }, [])

  // ADVANCED ANIMATION: Professional physics-based animation loop
  useEffect(() => {
    if (!containerRef.current) return

    const animate = () => {
      setFloatingTokens(prevTokens => {
        if (prevTokens.length === 0) return []
        
        const containerRect = containerRef.current!.getBoundingClientRect()
        const { width, height } = containerRect

        // Use a mutable copy for complex physics calculations
        const newTokens = structuredClone(prevTokens)

        // 1. Inter-token collision pass
        for (let i = 0; i < newTokens.length; i++) {
          for (let j = i + 1; j < newTokens.length; j++) {
            const tokenA = newTokens[i]
            const tokenB = newTokens[j]
            
            const dx = tokenB.x - tokenA.x
            const dy = tokenB.y - tokenA.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const minDistance = tokenA.radius + tokenB.radius

            if (distance < minDistance) {
              
              const normalX = dx / distance
              const normalY = dy / distance

              // Resolve overlap to prevent sticking
              const overlap = (minDistance - distance) / 2
              tokenA.x -= overlap * normalX
              tokenA.y -= overlap * normalY
              tokenB.x += overlap * normalX
              tokenB.y += overlap * normalY

              // Elastic collision using 1D formula on the normal vector
              const v1 = { x: tokenA.vx, y: tokenA.vy }
              const v2 = { x: tokenB.vx, y: tokenB.vy }
              
              const v1n = v1.x * normalX + v1.y * normalY
              const v2n = v2.x * normalX + v2.y * normalY
              
              const v1t = v1.x * -normalY + v1.y * normalX
              const v2t = v2.x * -normalY + v2.y * normalX
              
              // Swap normal velocities
              tokenA.vx = v2n * normalX + v1t * -normalY
              tokenA.vy = v2n * normalY + v1t * normalX
              tokenB.vx = v1n * normalX + v2t * -normalY
              tokenB.vy = v1n * normalY + v2t * normalX
            }
          }
        }
        
        // 2. Update pass (mouse, walls, position)
        return newTokens.map(token => {
          let { x, y, vx, vy, rotation, scale } = token
const { targetScale, rotationSpeed } = token

          // Mouse Repulsion
          const dxMouse = x - mousePosition.x
          const dyMouse = y - mousePosition.y
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse)
          const mouseInteractionRadius = 150
          
          if (distMouse < mouseInteractionRadius) {
            const angle = Math.atan2(dyMouse, dxMouse)
            // Force is stronger when closer to the mouse
            const force = (1 - distMouse / mouseInteractionRadius) * 0.8
            vx += Math.cos(angle) * force
            vy += Math.sin(angle) * force
          }
          
          // Gentle random drift to keep things from stopping
          vx += (Math.random() - 0.5) * 0.02
          vy += (Math.random() - 0.5) * 0.02

          // Friction
          vx *= 0.98
          vy *= 0.98

          // Update position
          x += vx
          y += vy

          // Wall bouncing with better energy conservation
          if (x <= token.radius || x >= width - token.radius) {
            vx *= -0.9 // Lose only 10% velocity on bounce
            x = Math.max(token.radius, Math.min(width - token.radius, x))
          }
          if (y <= token.radius || y >= height - token.radius) {
            vy *= -0.9
            y = Math.max(token.radius, Math.min(height - token.radius, y))
          }
          
          rotation += rotationSpeed

          // Smooth scaling on hover
          const scaleDiff = targetScale - scale
          scale += scaleDiff * 0.1

          return { ...token, x, y, vx, vy, rotation, scale }
        })
      })
      
      animationRef.current = requestAnimationFrame(animate)
    }

    // Start animation only if there are tokens
    if (floatingTokens.length > 0) {
        animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [floatingTokens.length, mousePosition.x, mousePosition.y]) // Rerun effect setup if tokens are added/removed or mouse moves

  // Mouse interaction handlers
  const handleTokenInteraction = useCallback((tokenId: string, isHovering: boolean) => {
    setFloatingTokens(prev => prev.map(token => {
      if (token.id === tokenId) {
        return {
          ...token,
          targetScale: isHovering ? 1.3 : 1,
          rotationSpeed: isHovering ? token.rotationSpeed * 1.5 : token.rotationSpeed / 1.5
        }
      }
      return token
    }))
  }, [])

  const handleClick = useCallback((tokenId: string) => {
    setFloatingTokens(prev => prev.map(token => {
      if (token.id === tokenId) {
        return {
          ...token,
          // Give it a more energetic push on click
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          rotationSpeed: (Math.random() - 0.5) * 5
        }
      }
      return token
    }))
  }, [])

  // Universal mouse move handler for title and token canvas
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Title background effect
      if (titleRef.current) {
        const mouseX = e.clientX
        const mouseY = e.clientY
        const traX = ((4 * mouseX) / 570) + 40
        const traY = ((4 * mouseY) / 570) + 50
        titleRef.current.style.backgroundPosition = `${traX}% ${traY}%`
      }
      
      // Update mouse position relative to the animation container
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }
    }

    document.addEventListener('mousemove', handleMouseMove);

    // Set mouse out of bounds when leaving the window to stop interaction
    const handleMouseLeave = () => setMousePosition({ x: -9999, y: -9999 });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, []);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/tokens')
        if (!response.ok) throw new Error('Failed to fetch tokens')
        const result = await response.json()
        setData(result)
        // Toast notification would go here - you can add sonner back if needed
        console.log(`Successfully loaded ${result.tokens.length} unique meme assets.`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Data Fetch Failed:', err)
      } finally {
        setIsLoading(false)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    }

    fetchTokens()
    const interval = setInterval(fetchTokens, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
      .then(() => {
        // Success! Show a success toast.
        toast.success("Address copied to clipboard!", {
          description: address, // Optionally show the copied address in the description
          // You can add an action button if needed:
          // action: {
          //   label: "Undo",
          //   onClick: () => console.log("Undo!"),
          // },
        });
      })
      .catch(err => {
        // Error! Show an error toast.
        console.error("Failed to copy address: ", err);
        toast.error("Failed to copy address.", {
          description: "Please try again or copy manually.",
        });
      });
  };

  const handleScroll = () => {
    if (tokenListRef.current) {
      const { scrollTop } = tokenListRef.current
      const scrollHint = document.getElementById('scroll-hint')
      if (scrollHint) {
        scrollHint.classList.toggle('opacity-0', scrollTop > 30)
        scrollHint.classList.toggle('translate-y-1', scrollTop > 30)
      }
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-violet-700 text-gray-100 relative overflow-hidden">
      <Toaster richColors position="bottom-right" theme="dark" />

      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-10 sm:py-12 grid gap-8">
        {/* Hero Section */}

        <div className="relative bg-gradient-to-br from-gray-900/95 via-black/98 to-violet-900/40 backdrop-blur-xl rounded-2xl border border-purple-400/40 shadow-2xl shadow-purple-500/30 p-20 text-center overflow-hidden">
  {/* Floating Tokens Container */}
  <div 
    ref={containerRef}
    className="absolute inset-0 pointer-events-none"
    style={{ zIndex: 5 }}
  >
    {floatingTokens.map((token) => (
      <div
        key={token.id}
        className="absolute pointer-events-auto cursor-pointer select-none"
        style={{
          left: token.x - token.radius,
          top: token.y - token.radius,
          width: token.radius * 2,
          height: token.radius * 2,
          transform: `rotate(${token.rotation}deg) scale(${token.scale})`,
          opacity: token.opacity,
          transition: 'transform 0.1s linear, opacity 0.3s ease' // Smooth scaling transition
        }}
        onMouseEnter={() => handleTokenInteraction(token.id, true)}
        onMouseLeave={() => handleTokenInteraction(token.id, false)}
        onClick={() => handleClick(token.id)}
      >
        
        
        {/* Token image */}
        <Image
  src={`/mmw-logos/${token.image}`}
  alt="Token"
  width={token.radius * 2}
  height={token.radius * 2}
  className="w-full h-full object-cover rounded-full border-2 border-white/20 hover:border-purple-400/60 transition-all duration-300"
  draggable={false}
/>
        
      </div>
    ))}
  </div>

  {/* Main content with higher z-index and text shadow backdrop */}
  <div className="relative pointer-events-none" style={{ zIndex: 20 }}>
    {/* Background text shadow for better contrast */}
    <div className="absolute inset-0 bg-black/30 rounded-2xl blur-xl"></div>
    
    <div className="relative">
      <h1 className="text-5xl sm:text-7xl font-black tracking-tight lg:text-8xl mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-300 drop-shadow-2xl" 
          style={{ 
            textShadow: '0 0 40px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.9), 2px 2px 4px rgba(0,0,0,1)',
            filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))'
          }}>
        Million Memes Wallet
      </h1>
      
      {/* Enhanced subtitle with better contrast */}
      <div className="relative">
      <div className="absolute inset-0 bg-black/50 rounded-lg blur-md"></div>
      <p className="relative text-xl sm:text-2xl text-white max-w-3xl mx-auto leading-relaxed font-medium px-6 py-4 whitespace-nowrap"
         style={{
           textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)',
           filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))'
         }}>
        The ultimate graveyard for your{' '}
        <span className="text-red-300 font-bold bg-black/40 px-2 py-1 rounded-md border border-red-500/30"
              style={{ textShadow: '0 0 15px rgba(239, 68, 68, 0.5)' }}>
          dead coins
        </span>{' '}
        and{' '}
        <span className="text-cyan-300 font-bold bg-black/40 px-2 py-1 rounded-md border border-cyan-500/30"
              style={{ textShadow: '0 0 15px rgba(103, 232, 249, 0.5)' }}>
          forgotten gems
        </span>.
      </p>
    </div>
    </div>
  </div>
</div>

        <div className="grid gap-8 md:gap-10">
          {/* Donation Call-to-Action */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl border border-gray-700/50 shadow-2xl shadow-black/30">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-black/95 to-violet-900/30 backdrop-blur-xl rounded-2xl shadow-2xl shadow-purple-500/20 " />
            <CardContent className="relative z-10 pt-8 pb-6 px-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <GiReceiveMoney className="w-12 h-12 text-red-500 animate-spin-slow" />
                    <div className="absolute inset-0 w-12 h-12 border-2 border-red-400/30 rounded-full animate-ping" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-zinc-400 to-orange-400 bg-clip-text text-transparent">
                Got Dead Coins? We&apos;ll Take &apos;Em!
                </h3>
                
                <p className="mb-3 text-lg text-gray-300">
                  Send us your rugged, dumped, or forgotten Solana tokens
                </p>
                <p className="mb-6 text-sm text-gray-400">
                Every shitcoin tells a story. Let&apos;s collect them all and reach 1M tokens!
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg blur-sm opacity-50 animate-pulse" />
                    <div className="relative font-mono text-purple-300 flex-shrink-0  max-w-full  text-sm sm:text-base px-4 py-3 bg-black/80  rounded-lg border border-purple-500/50">
                    64EC7dfQmatv6pQNrniU1RP4sJmzfhKN5SMeirhiupfy
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleCopyAddress('64EC7dfQmatv6pQNrniU1RP4sJmzfhKN5SMeirhiupfy')} 
                    className="relative w-full sm:w-auto bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
                  >
                    <ScrollText className="w-5 h-5 mr-2" />
                    Copy & Send Dead Coins
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-cyan-400/20 rounded-lg blur-xl animate-pulse cursor-pointer" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Counter */}
          <Card className="relative overflow-hidden border-1 border-teal-500/50 shadow-1xl shadow-purple-200/30 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-cyan-600/5 to-pink-600/5 " />
            <CardContent className="relative z-10 pt-8 pb-6">
              <div className="text-center">
                {data ? (
                  <div className="space-y-4">
                    <div className="text-6xl sm:text-8xl font-black bg-gradient-to-r from-purple-400 via-teal-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                      {data.totalTokens.toLocaleString()}
                    </div>
                    <div className="text-2xl bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      / 1,000,000 Dead Coins Collected
                    </div>
                    <div className="w-full max-w-md mx-auto bg-gray-800 rounded-full h-4 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 rounded-full transition-all duration-1000 ease-out animate-pulse"
                        style={{ width: `${(data.totalTokens / 1000000) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      {((data.totalTokens / 1000000) * 100).toFixed(2)}% Complete - Keep &apos;em coming! 🔥
                    </p>
                  </div>
                ) : error ? (
                  <div className="text-red-400 space-y-2">
                    <div className="text-4xl">⚠️</div>
                    <div>Error Loading Degen Stats</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                      <div className="absolute inset-0 w-16 h-16 border-4 border-cyan-500/20 border-b-cyan-500 rounded-full animate-spin-reverse" />
                    </div>
                    <p className="text-lg text-gray-400">Loading degen statistics...</p>
                  </div>
                )}
              </div>
              <div className="mt-4 text-center text-sm text-gray-500">
                {isLoading ? 'Scanning the blockchain for dead coins...' : `Last updated: ${lastUpdated}`}
              </div>
            </CardContent>
          </Card>

          {/* Token List */}
          <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl border border-gray-700/50 shadow-2xl shadow-black/30">
            <CardHeader className="border-b border-gray-700/50 ">
              <CardTitle className="flex items-center gap-3">

                <span className="text-2xl sm:text-3xl text-zinc-300 font-bold">
                  What we got so far... 💀
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative">
                <ScrollArea 
                  className="h-[400px] pr-4 px-4"
                  ref={tokenListRef}
                  onScroll={handleScroll}
                >
                  {error ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="text-6xl">💀</div>
                      <div className="text-red-400 text-lg">Failed to load the graveyard</div>
                      <p className="text-sm text-red-500/70">The blockchain gods are not pleased</p>
                    </div>
                  ) : data && data.tokens.length > 0 ? (
                    <div className="space-y-3">
                      {data.tokens.map((token, index) => (
                        <div 
                          key={index} 
                          className="group relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 hover:from-purple-800/30 hover:to-cyan-800/30 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div className="relative z-10 flex justify-between items-center">
                            <div className="flex items-center space-x-4 min-w-0 flex-1">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500 animate-pulse flex-shrink-0" />
                              
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-bold text-gray-100 group-hover:text-purple-300 transition-colors text-base sm:text-lg truncate">
                                    {token.name || 'Unknown Dead Coin'} 
                                  </span>
                                  {token.symbol && (
                                    <Badge className="bg-gray-700/50 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                                      ${token.symbol}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 group-hover:text-gray-400 truncate font-mono">
                                  {token.mint || 'No mint address'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right ml-4">
                              <div className="font-mono text-sm sm:text-base font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                {token.amount.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">tokens</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-6">
                      {isLoading ? (
                        <div className="space-y-4">
                          <div className="flex justify-center space-x-2">
                            {[0, 1, 2].map(i => (
                              <div 
                                key={i}
                                className="w-4 h-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.2}s` }}
                              />
                            ))}
                          </div>
                          <p className="text-lg text-gray-400">Searching for dead coins...</p>
                          <p className="text-sm text-gray-600">Scanning wallets across Solana...</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-6xl">🏴‍☠️</div>
                          <div>
                            <p className="text-xl text-gray-400 mb-2">The graveyard awaits its first victim</p>
                            <p className="text-sm text-gray-600">Send us your dead coins to get started!</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
                
                <div 
                  id="scroll-hint" 
                  className="flex items-center justify-center text-sm text-gray-600 transition-all duration-500 mt-3 opacity-100"
                >
                  <ArrowDownCircle className="w-4 h-4 mr-2 animate-bounce" />
                  Scroll to see all the carnage
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ==================== Development Roadmap ==================== */}
<Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-purple-500/10 rounded-2xl">
  <CardHeader className="border-b border-white/10 p-6">
    <CardTitle className="flex items-center gap-4">
      <div className="p-2 bg-purple-500/10 rounded-lg border border-white/10">
        <Rocket className="w-6 h-6 text-purple-300" />
      </div>
      <span className="text-2xl sm:text-3xl text-zinc-100 font-bold tracking-tight">
        under cooking...
      </span>
    </CardTitle>
    
  </CardHeader>
  <CardContent className="pt-8 p-6">
    <div className="grid gap-6 md:grid-cols-3">
      {[
         {

                              title: "Coin of Shame Hall",
          
                              description: "Showcase the biggest rugpulls and worst performers.",
          
                              icon: Crown,
          
                              badgeText: "Coming Soon",
          
                              gradient: "from-teal-500 to-pink-500"
          
                            },
          
                            {
          
                              title: "Auto Degen Alerts",
          
                              description: "Real-time Twitter notifications when someone sends us their bags. Maximum loyalty!",
          
                              icon: Bot,
          
                              badgeText: "In Development",
          
                              gradient: "from-teal-500 to-pink-500"
          
                            },
          
                            {
          
                              title: "Top Bag Holders",
          
                              description: "Leaderboard of the biggers donors who contributed the most dead coins. Wear your L with pride!",
          
                              icon: Trophy,
          
                              badgeText: "Epic Feature",
          
                              gradient: "from-teal-500 to-pink-500"
          
                            }
      ].map((feature, idx) => (
        <Card 
          key={idx} 
          className="group relative overflow-hidden bg-white/5 backdrop-blur-lg border border-white/10 transition-all duration-300 hover:border-white/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10"
        >
          {/* Subtle gradient glow on hover */}
          <div className={`absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-35 transition-opacity duration-500 blur-3xl`} />
          
          <CardContent className="relative p-6 text-center flex flex-col h-full">
            <div className="mb-6 flex-grow-0">
              <div className="inline-flex p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
                <feature.icon className="w-8 h-8 text-zinc-300 group-hover:text-white transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>
            
            <h3 className="font-bold mb-3 text-lg text-zinc-100">
              {feature.title}
            </h3>
            
            <p className="text-sm text-zinc-400 mb-6 flex-grow">
              {feature.description}
            </p>
            
            <div className="mt-auto">
              <Badge variant="outline" className="border-white/20 bg-white/5 text-zinc-300 px-3 py-1 text-xs font-medium">
                {feature.badgeText}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </CardContent>
</Card>

          {/* Footer */}
          <Card className="text-center bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl border border-gray-700/50 shadow-2xl shadow-black/30">
            <CardContent className="pt-8 pb-6 px-6">
              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-lg text-gray-300 font-semibold">
                    Enjoying the chaos? Support the madness! 🔥
                  </p>
                  <p className="mb-6 text-sm text-gray-500">
                    Your donations help us build the ultimate dead coin empire
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative font-mono text-purple-300 truncate text-sm px-4 py-3 bg-black/80 backdrop-blur-sm rounded-lg border border-purple-500/50">
                    64EC7dfQmatv6pQNrniU1RP4sJmzfhKN5SMeirhiupfy
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleCopyAddress('64EC7dfQmatv6pQNrniU1RP4sJmzfhKN5SMeirhiupfy')} 
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  >
                    <ScrollText className="w-4 h-4 mr-2" />
                    Copy Donation Address
                  </Button>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                  <a 
                    href="https://x.com/MemesTo1M"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <FaSquareXTwitter className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                    <span className="font-semibold">@MemesTo1M</span>
                    <ExternalLink className="w-3 h-3 ml-1 opacity-60 group-hover:opacity-90 transition-opacity" />
                  </a>
                  
                  <span className="text-gray-600 hidden sm:block">•</span>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                    Stay tuned to celebrate the 1M memes goal.
                  </div>
                </div>
                
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Data last updated: {lastUpdated || 'Initializing the chaos...'}</div>
                  <div className="flex items-center justify-center space-x-2">
                    <span>Powered by</span>
                    <span className="font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Solana</span>
                    <span>•</span>
                    <span>Built for</span>
                    <span className="font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">Rekt Degens</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Custom Styles */}
      <style jsx>{`

`}</style>
    </main>
  )
}