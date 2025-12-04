'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, Loader2, Upload, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'

const formSchema = z.object({
    bio: z.string().max(200, 'Máximo 200 caracteres').optional(),
    degree: z.string().optional(),
    session_duration: z.number().optional(),
    payment_methods: z.array(z.string()).optional(),
})

export default function EditProfilePage() {
    const [isLoading, setIsLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            bio: '',
            degree: 'none',
            session_duration: 604800, // 7 days default
            payment_methods: [],
        },
    })
    const supabase = createClient()

    useEffect(() => {
        async function loadProfile() {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) {
                router.push('/auth/login')
                return
            }

            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single()

            if (profile) {
                setUser(profile)
                setAvatarUrl(profile.avatar_url)
                form.reset({
                    bio: profile.bio || '',
                    degree: profile.degree || 'none',
                    session_duration: profile.session_duration || 604800,
                    payment_methods: profile.payment_methods || [],
                })
            }
        }
        loadProfile()
    }, [router, supabase])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user) return

        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    bio: values.bio,
                    degree: values.degree === 'none' ? '' : values.degree,
                    session_duration: values.session_duration,
                    payment_methods: values.payment_methods,
                })
                .eq('id', user.id)

            if (error) throw error

            toast.success('Perfil actualizado')
            router.push('/profile')
            router.refresh()

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Error al actualizar perfil')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('El archivo debe ser una imagen')
            return
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('La imagen debe ser menor a 2MB')
            return
        }

        // Show preview immediately
        const reader = new FileReader()
        reader.onloadend = () => {
            setAvatarUrl(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Upload file
        setIsLoading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            // Upload new avatar
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // Update user profile
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id)

            if (updateError) throw updateError

            toast.success('Foto de perfil actualizada')
            setAvatarUrl(publicUrl)
            router.refresh()

        } catch (error: any) {
            console.error('Error uploading avatar:', error)
            toast.error('Error al subir la imagen')
            setAvatarUrl(user?.avatar_url || null)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center gap-3">
                <Link href="/profile">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold">Editar Perfil</h1>
            </div>

            <div className="p-4 space-y-6 pb-40 pb-safe">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4 py-6">
                    <div className="relative group cursor-pointer" onClick={() => !isLoading && document.getElementById('avatar-upload')?.click()}>
                        <Avatar className="h-32 w-32 border-4 border-primary/20 transition-all group-hover:border-primary/40">
                            <AvatarImage src={avatarUrl || undefined} />
                            <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/5">
                                {user?.alias_inst?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>

                        {/* Pencil Badge - Hidden during upload */}
                        {!isLoading && (
                            <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full p-2.5 shadow-lg border-2 border-background transition-all group-hover:scale-110 group-hover:shadow-xl">
                                <Pencil className="h-4 w-4" />
                            </div>
                        )}

                        {/* Loading overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                <Loader2 className="h-10 w-10 text-white animate-spin" />
                            </div>
                        )}

                        {/* Hover overlay - Only when not loading */}
                        {!isLoading && (
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Upload className="h-8 w-8 text-white" />
                            </div>
                        )}
                    </div>

                    <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                    />

                    <div className="text-center">
                        <p className="text-sm font-medium">@{user?.alias_inst || 'usuario'}</p>
                        {isLoading ? (
                            <p className="text-xs text-primary mt-0.5 flex items-center justify-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Subiendo imagen...
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground mt-0.5">Haz clic en la foto para cambiarla</p>
                        )}
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <FormLabel>Alias</FormLabel>
                            <Input value={user?.alias_inst || ''} disabled />
                            <p className="text-xs text-muted-foreground">
                                Tu alias se genera automáticamente desde tu email
                            </p>
                        </div>

                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Biografía</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Cuéntanos algo sobre ti..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Máximo 200 caracteres
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <FormLabel>Email</FormLabel>
                            <Input value={user?.email || ''} disabled />
                            <p className="text-xs text-muted-foreground">
                                No puedes cambiar tu email
                            </p>
                        </div>

                        <FormField
                            control={form.control}
                            name="degree"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Grado</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue placeholder="Selecciona tu grado" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="max-h-[300px]">
                                            <SelectItem value="none">Sin especificar</SelectItem>
                                            <SelectItem value="Grado en Ingeniería Informática">Grado en Ingeniería Informática</SelectItem>
                                            <SelectItem value="Grado en Ingeniería Industrial">Grado en Ingeniería Industrial</SelectItem>
                                            <SelectItem value="Grado en Administración y Dirección de Empresas">Grado en ADE</SelectItem>
                                            <SelectItem value="Grado en Enfermería">Grado en Enfermería</SelectItem>
                                            <SelectItem value="Grado en Arquitectura">Grado en Arquitectura</SelectItem>
                                            <SelectItem value="Grado en Biología">Grado en Biología</SelectItem>
                                            <SelectItem value="Grado en Derecho">Grado en Derecho</SelectItem>
                                            <SelectItem value="Grado en Educación Infantil">Grado en Educación Infantil</SelectItem>
                                            <SelectItem value="Grado en Educación Primaria">Grado en Educación Primaria</SelectItem>
                                            <SelectItem value="Grado en Fisioterapia">Grado en Fisioterapia</SelectItem>
                                            <SelectItem value="Otro">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Esto ayuda a otros estudiantes a encontrar artículos relevantes
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="payment_methods"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Métodos de pago aceptados</FormLabel>
                                        <FormDescription>
                                            Selecciona los métodos de pago que aceptas para tus ventas.
                                        </FormDescription>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {['Bizum', 'PayPal', 'Efectivo', 'Transferencia'].map((item) => (
                                            <FormField
                                                key={item}
                                                control={form.control}
                                                name="payment_methods"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={item}
                                                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(item)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...(field.value || []), item])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== item
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer w-full">
                                                                {item}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="session_duration"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duración de Sesión</FormLabel>
                                    <Select
                                        onValueChange={(value) => field.onChange(parseInt(value))}
                                        value={field.value?.toString()}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona duración" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="86400">1 día</SelectItem>
                                            <SelectItem value="604800">7 días (recomendado)</SelectItem>
                                            <SelectItem value="2592000">30 días</SelectItem>
                                            <SelectItem value="31536000">No expirar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Tu sesión permanecerá activa durante este tiempo después de cerrar la pestaña
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    )
}
