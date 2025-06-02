'use client'

import Image from 'next/image'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Crown, Trophy, ScrollText, ExternalLink, ArrowDownCircle, Bot, Zap} from 'lucide-react'
import { toast, Toaster } from "sonner";
import { FaSquareXTwitter } from "react-icons/fa6";
import { GiReceiveMoney } from "react-icons/gi";
import { GiCook } from "react-icons/gi";

interface Token {
  name: string
  symbol: string | null
  amount: number
  mintAddress: string
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

// Move tokenLogos outside component to avoid dependency issues
const tokenLogos = [
  'bananan.jpeg', 'bert.png', 'catmask.jpeg', 'chill.jpeg', 'daddy.jpeg',
  'dmaga.jpeg', 'dogeai.jpeg', 'eloniron.jpeg', 'fwog.png', 'genwealth.png',
  'gork.jpeg', 'hoodrat.jpeg', 'house.jpeg', 'kek.jpeg', 'labubu.png',
  'moodeng.png', 'moonpig.png', 'pepeai.jpeg', 'pnut.jpeg', 'prope.jpeg',
  'rizz.jpeg', 'sigma.png', 'stonks.jpeg', 'titcoin.jpeg', 'troll.png',
  'unico.jpeg', 'wif.png', 'wojak.jpeg', 'would.jpeg'
];

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
  
  // Initialize floating tokens
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    
    // REDUCED TOKEN COUNT FOR BETTER MOBILE PERFORMANCE
    const initialTokens: FloatingToken[] = tokenLogos.slice(0, 29).map((logo, index) => {
      const radius = 30 + Math.random() * 20 // Slightly smaller radius for mobile
      return {
        id: `token-${index}`,
        x: radius + Math.random() * (containerRect.width - radius * 2),
        y: radius + Math.random() * (containerRect.height - radius * 2),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: radius,
        image: logo,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.4,
        scale: 1,
        targetScale: 1,
        opacity: 0.8 + Math.random() * 0.2
      }
    })

    setFloatingTokens(initialTokens)
  }, []) // No need to include tokenLogos since it's now outside the component

  // ADVANCED ANIMATION: Professional physics-based animation loop
  useEffect(() => {
    if (!containerRef.current) return

    const animate = () => {
      setFloatingTokens(prevTokens => {
        if (prevTokens.length === 0) return []
        
        const containerRect = containerRef.current!.getBoundingClientRect()
        const { width, height } = containerRect

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
              const overlap = (minDistance - distance) / 2
              tokenA.x -= overlap * normalX
              tokenA.y -= overlap * normalY
              tokenB.x += overlap * normalX
              tokenB.y += overlap * normalY

              const v1 = { x: tokenA.vx, y: tokenA.vy }
              const v2 = { x: tokenB.vx, y: tokenB.vy }
              const v1n = v1.x * normalX + v1.y * normalY
              const v2n = v2.x * normalX + v2.y * normalY
              const v1t = v1.x * -normalY + v1.y * normalX
              const v2t = v2.x * -normalY + v2.y * normalX
              
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

          const dxMouse = x - mousePosition.x
          const dyMouse = y - mousePosition.y
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse)
          const mouseInteractionRadius = 120 // Reduced radius for more controlled interaction
          
          if (distMouse < mouseInteractionRadius) {
            const angle = Math.atan2(dyMouse, dxMouse)
            const force = (1 - distMouse / mouseInteractionRadius) * 0.6
            vx += Math.cos(angle) * force
            vy += Math.sin(angle) * force
          }
          
          vx += (Math.random() - 0.5) * 0.02
          vy += (Math.random() - 0.5) * 0.02

          vx *= 0.98
          vy *= 0.98

          x += vx
          y += vy

          if (x <= token.radius || x >= width - token.radius) {
            vx *= -0.9
            x = Math.max(token.radius, Math.min(width - token.radius, x))
          }
          if (y <= token.radius || y >= height - token.radius) {
            vy *= -0.9
            y = Math.max(token.radius, Math.min(height - token.radius, y))
          }
          
          rotation += rotationSpeed
          const scaleDiff = targetScale - scale
          scale += scaleDiff * 0.1

          return { ...token, x, y, vx, vy, rotation, scale }
        })
      })
      
      animationRef.current = requestAnimationFrame(animate)
    }

    if (floatingTokens.length > 0) {
        animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [floatingTokens.length, mousePosition.x, mousePosition.y])

  const handleTokenInteraction = useCallback((tokenId: string, isHovering: boolean) => {
    setFloatingTokens(prev => prev.map(token => 
      token.id === tokenId 
        ? { ...token, targetScale: isHovering ? 1.3 : 1 }
        : token
    ))
  }, [])

  const handleClick = useCallback((tokenId: string) => {
    setFloatingTokens(prev => prev.map(token => 
      token.id === tokenId 
        ? { ...token, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15, rotationSpeed: (Math.random() - 0.5) * 5 }
        : token
    ))
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (titleRef.current) {
        const mouseX = e.clientX, mouseY = e.clientY
        const traX = ((4 * mouseX) / 570) + 40, traY = ((4 * mouseY) / 570) + 50
        titleRef.current.style.backgroundPosition = `${traX}% ${traY}%`
      }
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }
    }
    const handleMouseLeave = () => setMousePosition({ x: -9999, y: -9999 });

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

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
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred')
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
      .then(() => toast.success("Address copied to clipboard!", { description: address }))
      .catch(() => toast.error("Failed to copy address.", { description: "Please try again or copy manually." }));
  };

  const handleScroll = () => {
    if (tokenListRef.current) {
      const { scrollTop } = tokenListRef.current
      const scrollHint = document.getElementById('scroll-hint')
      if (scrollHint) {
        scrollHint.classList.toggle('opacity-0', scrollTop > 30)
      }
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-gray-100 relative overflow-hidden">
      <Toaster richColors position="bottom-right" theme="dark" />

      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-8 sm:py-12 grid gap-6 md:gap-8">
        
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-gray-900/95 via-black/98 to-emerald-900/40 backdrop-blur-xl rounded-2xl border border-zinc-600/40 shadow-2xl shadow-purple-500/10 p-8 sm:p-12 md:p-20 text-center overflow-hidden">
          <div ref={containerRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
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
                  transition: 'transform 0.1s linear, opacity 0.3s ease'
                }}
                onMouseEnter={() => handleTokenInteraction(token.id, true)}
                onMouseLeave={() => handleTokenInteraction(token.id, false)}
                onClick={() => handleClick(token.id)}
              >
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

          <div className="relative pointer-events-none" style={{ zIndex: 20 }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40 rounded-3xl blur-2xl"></div>
            <div className="relative space-y-6">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-semibold tracking-tight bg-gradient-to-r from-emerald-500 via-yellow-100 to-violet-500 inline-block text-transparent bg-clip-text" 
                  style={{  }}>
                Million Memes Wallet
              </h1>
              <div className="relative max-w-4xl mx-auto">
                <p className="text-lg sm:text-2xl text-white/90 leading-relaxed font-medium"
                   style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                  <span className="inline-block bg-white/10 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-xl border border-white/20 mx-1 my-1">
                    1 Wallet.
                  </span>
                  <span className="inline-block text-emerald-300 font-semibold bg-emerald-500/10 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-xl border border-emerald-400/30 mx-1 my-1">
                    1 Million Memes.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:gap-8">
          {/* Donation Call-to-Action */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl border border-gray-700/50 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-black/95 to-violet-900/30 backdrop-blur-xl"/>
            <CardContent className="relative z-10 p-6 sm:p-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <GiReceiveMoney className="w-12 h-12 text-emerald-500 animate-spin-slow" />
                    <div className="absolute inset-0 w-12 h-12 border-2 border-emerald-400/30 rounded-full animate-ping" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-zinc-400 to-emerald-200 bg-clip-text text-transparent">
                  Got Dead Coins? We&apos;ll Take &apos;Em!
                </h3>
                <p className="mb-4 text-base text-gray-300">
                Send us your rugged, dumped, or forgotten Solana meme tokens.
                </p>
                <p className="mb-4 text-base text-gray-300">
                We&apos;re on a mission to break a world record by collecting 
        <strong className="bg-gradient-to-r from-emerald-500 to-yellow-200 bg-clip-text text-transparent font-semibold"> 1 Million Memes in 1 Single Wallet</strong>.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 group">
                  <div className="relative w-full sm:w-auto">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg blur opacity-50 animate-pulse" />
                    <div className="relative font-mono text-purple-300 w-full text-xs sm:text-base px-4 py-3 bg-black/80 rounded-lg border border-purple-500/50 truncate">
                      64EC7dfQmatv6pQNrniU1RP4sJmzfhKN5SMeirhiupfy
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleCopyAddress('64EC7dfQmatv6pQNrniU1RP4sJmzfhKN5SMeirhiupfy')} 
                    className="relative w-full cursor-pointer sm:w-auto bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <ScrollText className="w-5 h-5 mr-2" />
                    Copy & Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Counter */}
          <Card className="relative overflow-hidden border border-zinc-700/50 bg-gradient-to-br from-gray-900/90 via-black/95 to-violet-900/30 backdrop-blur-xl">
            <CardContent className="relative z-10 p-6 sm:p-8">
              <div className="text-center">
                {data ? (
                  <div className="space-y-4">
                    <div className="text-6xl sm:text-8xl font-black text-white animate-pulse">
                      {data.totalTokens.toLocaleString()}
                    </div>
                    <div className="text-lg sm:text-2xl bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      / 1,000,000 Dead Coins Collected
                    </div>
                    <div className="w-full max-w-md mx-auto bg-gray-800 rounded-full h-4 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 rounded-full transition-all duration-1000 ease-out animate-pulse"
                        style={{ width: `${(data.totalTokens / 1000000) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      {((data.totalTokens / 1000000) * 100).toFixed(2)}% Complete
                    </p>
                  </div>
                ) : error ? (
                  <div className="text-red-400 space-y-2 py-8">
                    <div className="text-4xl">⚠️</div>
                    <div>Error Loading Stats</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4 py-8">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                    <p className="text-lg text-gray-400">Loading degen statistics...</p>
                  </div>
                )}
              </div>
              <div className="mt-4 text-center text-xs sm:text-sm text-gray-500">
                {isLoading ? 'Scanning the blockchain...' : `Last updated: ${lastUpdated}`}
              </div>
            </CardContent>
          </Card>

          {/* Token List */}
<Card className="relative overflow-hidden border border-zinc-700/50 bg-gradient-to-br from-gray-900/90 via-black/95 to-violet-900/30 backdrop-blur-xl">
  <CardHeader className="border-b border-gray-700/50 px-3 py-4 sm:px-6 sm:py-6">
    <CardTitle className="flex items-center gap-2 sm:gap-3">
      <span className="text-lg sm:text-xl lg:text-2xl text-zinc-300 font-bold leading-tight">
        What we got so far...
      </span>
    </CardTitle>
  </CardHeader>
  <CardContent className="p-3 sm:p-4 lg:p-6">
    <div className="relative">
      <ScrollArea 
        className="h-[350px] sm:h-[400px] pr-2 sm:pr-4"
        ref={tokenListRef}
        onScroll={handleScroll}
      >
        {error ? (
          <div className="text-center py-8 sm:py-12 space-y-3 sm:space-y-4">
            <div className="text-4xl sm:text-5xl">💀</div>
            <div className="text-red-400 text-base sm:text-lg px-4">Failed to load the graveyard</div>
          </div>
        ) : data && data.tokens.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {data.tokens.map((token, index) => (
              <div 
                key={index} 
                className="group relative overflow-hidden p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer active:scale-[0.98] sm:active:scale-100"
                onClick={() => window.open(`https://dexscreener.com/solana/${token.mintAddress}`, '_blank')}
              >
                <div className="relative z-10">
                  {/* Mobile Layout: Stack vertically */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                    {/* Token Info Section */}
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-1 sm:gap-2 mb-1">
                          <span className="font-bold text-gray-100 group-hover:text-purple-300 transition-colors text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
                            {token.name || 'Unknown Dead Coin'} 
                          </span>
                          {token.symbol && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1">
                              ${token.symbol}
                            </Badge>
                          )}
                        </div>
                        {/* Mobile: Show address on separate line with better truncation */}
                        <div className="text-xs text-gray-500 group-hover:text-gray-400 font-mono break-all sm:truncate">
                          <span className="sm:hidden">
                            {`${token.mintAddress.slice(0, 8)}...${token.mintAddress.slice(-8)}`}
                          </span>
                          <span className="hidden sm:inline">
                            {token.mintAddress}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amount Section */}
                    <div className="flex justify-between items-center sm:block sm:text-right ml-0 sm:ml-2 flex-shrink-0">
                      <div className="sm:hidden text-xs text-gray-500">Amount:</div>
                      <div>
                        <div className="font-mono text-sm sm:text-base font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                          {token.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 hidden sm:block">tokens</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 space-y-4 sm:space-y-6 px-4">
            {isLoading ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-center space-x-2">
                  {[0, 1, 2].map(i => 
                    <div 
                      key={i} 
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500 rounded-full animate-bounce" 
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  )}
                </div>
                <p className="text-base sm:text-lg text-gray-400">Searching for dead coins...</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div className="text-4xl sm:text-5xl">🏴‍☠️</div>
                <p className="text-base sm:text-lg text-gray-400">The graveyard is empty.</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
      <div id="scroll-hint" className="flex items-center justify-center text-xs text-gray-600 transition-opacity duration-500 mt-2 sm:mt-3 opacity-100">
        <ArrowDownCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-bounce" />
        <span className="hidden sm:inline">Scroll to see all</span>
        <span className="sm:hidden">Scroll for more</span>
      </div>
    </div>
  </CardContent>
</Card>

          {/* Development Roadmap */}
          <Card className="relative overflow-hidden border border-zinc-700/50 bg-gradient-to-br from-gray-900/90 via-black/95 to-violet-900/30 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <GiCook className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
                </div>
                <span className="text-lg sm:text-2xl text-zinc-100 font-bold">
                  Dev is cooking...
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { title: "King of the Wallet", description: "The meme with the highest USD value will be crowned the king of our collection.", icon: Crown },
                  { title: "Degen Alerts", description: "Real-time Twitter notifications when a new meme joins the wallet.", icon: Bot },
                  { title: "Top Donors", description: "A leaderboard showcasing the most generous addresses who contributed tokens.", icon: Trophy }
                ].map((feature, idx) => (
                  <Card key={idx} className="group relative overflow-hidden bg-white/5 backdrop-blur-lg border border-white/10 transition-all duration-300 hover:border-white/20 hover:scale-[1.02]">
                    <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-teal-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-3xl" />
                    <CardContent className="relative p-6 text-center flex flex-col h-full">
                      <div className="mb-4">
                        <div className="inline-flex p-3 rounded-xl bg-white/5 border border-white/10">
                          <feature.icon className="w-7 h-7 text-zinc-300 group-hover:text-white transition-transform duration-300" />
                        </div>
                      </div>
                      <h3 className="font-bold mb-2 text-base sm:text-lg text-zinc-100">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-zinc-400 flex-grow">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <Card className="text-center bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl border border-gray-700/50">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div>
                <p className="mb-2 text-base sm:text-lg text-gray-300 font-semibold">
                  Vibing with this? Toss a coin to the dev 🧙‍♂️
                </p>
                <p className="mb-4 text-xs sm:text-sm text-gray-500">
                  This is built out of pure degen love — hosting ain&apos;t free.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="relative w-full sm:w-auto">
                    <div className="relative font-mono text-purple-300 w-full text-xs sm:text-base px-4 py-3 bg-black/80 rounded-lg border border-purple-500/50 truncate">
                      64EC7dfQmatv6pQNrniU1RP4sJmzfhKN5SMeirhiupfy
                    </div>
                  </div>
                <Button 
                  onClick={() => handleCopyAddress('64EC7dfQmatv6pQNrniU1RP4sJmzfhKN5SMeirhiupfy')} 
                  className="w-full cursor-pointer sm:w-auto bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold px-6 py-3 rounded-lg transition-all"
                >
                  <ScrollText className="w-4 h-4 mr-2" />
                  Copy Address
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-2">
                <a href="https://x.com/MemesTo1M" target="_blank" rel="noopener noreferrer" className="group flex items-center text-cyan-400 hover:text-cyan-300 transition-colors text-sm">
                  <FaSquareXTwitter className="w-5 h-5 mr-2" />
                  <span className="font-semibold">@MemesTo1M</span>
                  <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
                </a>
                <span className="text-gray-600 hidden sm:block">•</span>
                <div className="flex items-center text-sm text-gray-500">
                  <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                  Stay tuned for the 1M meme goal.
                </div>
              </div>
              
              <div className="text-xs text-gray-600 space-y-1 pt-4 border-t border-gray-800">
                <div className="flex items-center justify-center space-x-2">
                  <span>Powered by</span>
                  <span className="font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Solana</span>
                  <span>•</span>
                  <span>Built for</span>
                  <span className="font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">Rekt Degens</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}