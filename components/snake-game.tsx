'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, X, ShoppingBag, Trophy, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'

type Point = { x: number, y: number }
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

// Bigger cells, Smaller grid for better visibility
const GRID_SIZE = 12
const CELL_SIZE = 36
const INITIAL_SPEED = 180

interface LeaderboardEntry {
    user_id: string
    score: number
    users: {
        alias_inst: string | null
    } | null
}

export function SnakeGame({ onClose }: { onClose: () => void }) {
    const [snake, setSnake] = useState<Point[]>([{ x: 6, y: 6 }])
    const [food, setFood] = useState<Point>({ x: 9, y: 3 })
    const [foodImage, setFoodImage] = useState<string | null>(null)
    const [productImages, setProductImages] = useState<string[]>([])

    // Game State
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isGameOver, setIsGameOver] = useState(false)

    // Leaderboard State
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)

    // Game Logic Refs
    const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
    const directionRef = useRef<Direction>('RIGHT')
    const commandQueueRef = useRef<Direction[]>([]) // Input Buffer
    const supabase = createClient()

    // 1. Initial Setup: Load HighScore & Fetch Product Images
    useEffect(() => {
        const stored = localStorage.getItem('snake_highscore')
        if (stored) setHighScore(parseInt(stored))

        async function fetchGameAssets() {
            try {
                // Fetch random listings to use as food
                const { data } = await supabase
                    .from('listings')
                    .select('photos')
                    .limit(30)
                    .order('created_at', { ascending: false })

                if (data) {
                    const photos = data
                        .flatMap(item => item.photos || [])
                        .map(photo => photo?.url)
                        .filter(url => typeof url === 'string' && url.length > 0)

                    if (photos.length > 0) {
                        setProductImages(photos)
                        setFoodImage(photos[Math.floor(Math.random() * photos.length)])
                    }
                }
            } catch (e) {
                console.error('Error loading Snake assets:', e)
            }
        }
        fetchGameAssets()
    }, [])

    // 2. High Score Sync & Leaderboard Submission
    useEffect(() => {
        if (score > highScore) {
            setHighScore(score)
            localStorage.setItem('snake_highscore', score.toString())
        }
    }, [score, highScore])

    const submitScore = async (finalScore: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Check existing score
            const { data: existing } = await supabase
                .from('snake_leaderboard')
                .select('score')
                .eq('user_id', user.id)
                .single()

            if (!existing || finalScore > existing.score) {
                // 2. Upsert (Insert or Update if user_id conflict)
                const { error } = await supabase
                    .from('snake_leaderboard')
                    .upsert({
                        user_id: user.id,
                        score: finalScore
                    }, { onConflict: 'user_id' })

                if (error) console.error('Error saving score:', error)
            }
        } catch (e) {
            console.error('Submit score error:', e)
        }
    }

    const fetchLeaderboard = async () => {
        setLoadingLeaderboard(true)
        try {
            const { data, error } = await supabase
                .from('snake_leaderboard')
                .select(`
                    user_id,
                    score,
                    users ( alias_inst )
                `)
                .order('score', { ascending: false })
                .limit(10)

            if (data) {
                setLeaderboard(data as any)
            }
        } catch (e) {
            console.error('Error fetching leaderboard:', e)
        } finally {
            setLoadingLeaderboard(false)
        }
    }

    // 3. Game Logic Helpers
    const generateFood = (currentSnake: Point[]) => {
        let newFood
        while (true) {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            }
            const collision = currentSnake.some(segment => segment.x === newFood!.x && segment.y === newFood!.y)
            if (!collision) break
        }
        setFood(newFood)
        if (productImages.length > 0) {
            const randomImg = productImages[Math.floor(Math.random() * productImages.length)]
            setFoodImage(randomImg)
        }
    }

    const resetGame = () => {
        setSnake([{ x: 6, y: 6 }])
        directionRef.current = 'RIGHT'
        commandQueueRef.current = [] // Clear input buffer
        setScore(0)
        setIsGameOver(false)
        setIsPlaying(true)
        generateFood([{ x: 6, y: 6 }])
    }

    const gameOver = () => {
        setIsGameOver(true)
        setIsPlaying(false)
        if (gameLoopRef.current) clearInterval(gameLoopRef.current)

        // Save score and fetch leaderboard
        submitScore(score)
        fetchLeaderboard()
    }

    const handleInput = (newDir: Direction) => {
        // Get the last requested direction, or current if queue is empty
        const lastQueuedDir = commandQueueRef.current.length > 0
            ? commandQueueRef.current[commandQueueRef.current.length - 1]
            : directionRef.current

        // Prevent opposite direction turns
        if (
            (newDir === 'UP' && lastQueuedDir === 'DOWN') ||
            (newDir === 'DOWN' && lastQueuedDir === 'UP') ||
            (newDir === 'LEFT' && lastQueuedDir === 'RIGHT') ||
            (newDir === 'RIGHT' && lastQueuedDir === 'LEFT') ||
            (newDir === lastQueuedDir) // Ignore same direction
        ) {
            return
        }

        // Add to buffer (limit buffer size to prevent infinite queueing)
        if (commandQueueRef.current.length < 2) {
            commandQueueRef.current.push(newDir)
        }
    }

    const moveSnake = () => {
        setSnake(prevSnake => {
            // Process Input Buffer
            if (commandQueueRef.current.length > 0) {
                directionRef.current = commandQueueRef.current.shift()!
            }

            const head = { ...prevSnake[0] }

            switch (directionRef.current) {
                case 'UP': head.y -= 1; break
                case 'DOWN': head.y += 1; break
                case 'LEFT': head.x -= 1; break
                case 'RIGHT': head.x += 1; break
            }

            // Wall Collision
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                gameOver()
                return prevSnake
            }

            // Self Collision
            if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
                gameOver()
                return prevSnake
            }

            const newSnake = [head, ...prevSnake]

            // Food Collision
            if (head.x === food.x && head.y === food.y) {
                setScore(s => s + 1) // 1 point per food
                generateFood(newSnake)
            } else {
                newSnake.pop()
            }

            return newSnake
        })
    }

    // 4. Input Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W': handleInput('UP'); break
                case 'ArrowDown': case 's': case 'S': handleInput('DOWN'); break
                case 'ArrowLeft': case 'a': case 'A': handleInput('LEFT'); break
                case 'ArrowRight': case 'd': case 'D': handleInput('RIGHT'); break
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // 5. Game Loop
    useEffect(() => {
        if (isPlaying && !isGameOver) {
            const speed = Math.max(80, INITIAL_SPEED - Math.floor(score / 5) * 5) // Faster progression with lower score cap
            gameLoopRef.current = setInterval(moveSnake, speed)
        } else {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current)
        }
        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current)
        }
    }, [isPlaying, isGameOver, score, food])

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4 text-white"
        >
            <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="text-primary h-5 w-5" />
                        <span className="font-bold">Snake BLife</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 bg-zinc-800 px-2 py-1 rounded-md">
                            <Trophy className="text-yellow-500 h-3.5 w-3.5" />
                            <span className="text-xs font-mono text-zinc-300">{highScore}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-zinc-400 hover:text-white">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Game / Leaderboard Area */}
                <div className="flex-1 flex items-center justify-center p-4 bg-black/50 relative overflow-hidden">

                    {/* Score Background */}
                    {!isGameOver && (
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-4xl font-black text-white/5 select-none z-0">
                            {score}
                        </div>
                    )}

                    {isGameOver ? (
                        /* LEADERBOARD VIEW */
                        <div className="w-full h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-6">
                                <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">GAME OVER</h2>
                                <p className="text-zinc-400 font-mono text-sm">PUNTUACIÓN FINAL: <span className="text-primary font-bold text-lg ml-1">{score}</span></p>
                            </div>

                            <div className="flex-1 bg-zinc-950/50 rounded-lg border border-zinc-800/50 p-4 overflow-y-auto mb-4 scrollbar-hide">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Crown className="h-3 w-3 text-yellow-500" /> TOP JUGADORES
                                </h3>

                                {loadingLeaderboard ? (
                                    <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" /></div>
                                ) : (
                                    <div className="space-y-2">
                                        {leaderboard.map((entry, i) => (
                                            <div key={entry.user_id} className="flex items-center justify-between text-sm p-2 rounded bg-zinc-900/50 border border-zinc-800/50">
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-mono w-4 text-center ${i < 3 ? 'text-yellow-500 font-bold' : 'text-zinc-600'}`}>#{i + 1}</span>
                                                    <span className={i === 0 ? 'text-white font-medium' : 'text-zinc-300'}>
                                                        {entry.users?.alias_inst || 'Usuario Anónimo'}
                                                    </span>
                                                </div>
                                                <span className="font-mono font-bold text-primary">{entry.score}</span>
                                            </div>
                                        ))}
                                        {leaderboard.length === 0 && <p className="text-center text-zinc-500 text-xs py-4">Sé el primero en el ranking.</p>}
                                    </div>
                                )}
                            </div>

                            <Button onClick={resetGame} size="lg" className="w-full font-bold gap-2">
                                <RotateCcw className="h-4 w-4" />
                                Jugar de nuevo
                            </Button>
                        </div>
                    ) : (
                        /* GAME GRID */
                        <div
                            className="relative bg-zinc-950 border border-zinc-800 rounded-lg shadow-inner overflow-hidden"
                            style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
                        >
                            {/* Food */}
                            <div
                                className="absolute flex items-center justify-center shadow-lg shadow-primary/20"
                                style={{
                                    width: CELL_SIZE - 2,
                                    height: CELL_SIZE - 2,
                                    left: food.x * CELL_SIZE + 1,
                                    top: food.y * CELL_SIZE + 1,
                                    transition: 'all 0.1s ease',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}
                            >
                                {foodImage ? (
                                    <img src={foodImage} alt="food" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-primary flex items-center justify-center">
                                        <ShoppingBag className="h-4 w-4 text-white fill-current" />
                                    </div>
                                )}
                            </div>

                            {/* Snake */}
                            {snake.map((segment, i) => (
                                <div
                                    key={`${segment.x}-${segment.y}-${i}`}
                                    className={`absolute rounded-xs border border-black/20 ${i === 0 ? 'bg-primary z-10' : 'bg-primary/70'}`}
                                    style={{
                                        width: CELL_SIZE,
                                        height: CELL_SIZE,
                                        left: segment.x * CELL_SIZE,
                                        top: segment.y * CELL_SIZE,
                                    }}
                                >
                                    {i === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-black rounded-full opacity-30" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Start Overlay */}
                            {!isPlaying && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 backdrop-blur-[1px]">
                                    <Button onClick={resetGame} size="lg" className="font-bold gap-2 shadow-lg shadow-primary/20">
                                        <Play className="h-5 w-5" />
                                        Jugar
                                    </Button>
                                    <p className="text-xs text-zinc-400 mt-4">WASD o Flechas</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Touch Controls (Only show when playing) */}
                {!isGameOver && (
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900 grid grid-cols-3 gap-2 place-items-center">
                        <div />
                        <Button
                            variant="secondary"
                            size="lg"
                            className="h-14 w-full bg-zinc-800 active:bg-zinc-700 active:scale-95 transition-all"
                            onPointerDown={(e) => { e.preventDefault(); handleInput('UP') }}
                        >
                            <ChevronUp className="h-8 w-8" />
                        </Button>
                        <div />

                        <Button
                            variant="secondary"
                            size="lg"
                            className="h-14 w-full bg-zinc-800 active:bg-zinc-700 active:scale-95 transition-all"
                            onPointerDown={(e) => { e.preventDefault(); handleInput('LEFT') }}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            className="h-14 w-full bg-zinc-800 active:bg-zinc-700 active:scale-95 transition-all"
                            onPointerDown={(e) => { e.preventDefault(); handleInput('DOWN') }}
                        >
                            <ChevronDown className="h-8 w-8" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            className="h-14 w-full bg-zinc-800 active:bg-zinc-700 active:scale-95 transition-all"
                            onPointerDown={(e) => { e.preventDefault(); handleInput('RIGHT') }}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </Button>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
