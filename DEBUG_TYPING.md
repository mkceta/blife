// Test para verificar que broadcast funciona
// Añade esto temporalmente al inicio de handleInputChange para debuggear:

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    // DEBUG: Verificar que el channel existe
    console.log('Channel exists:', !!channelRef.current)
    console.log('Input length:', e.target.value.length)

    if (channelRef.current && e.target.value.length > 0) {
        console.log('Sending typing=true broadcast')
        channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: currentUserId, typing: true }
        })
        
        // ... resto del código
    }
}

// También añade esto en el listener de broadcast para ver si recibe eventos:
.on('broadcast', { event: 'typing' }, (payload) => {
    console.log('Received typing broadcast:', payload)
    if (payload.payload.user_id !== currentUserId) {
        console.log('Setting isTyping to:', payload.payload.typing)
        setIsTyping(payload.payload.typing)
    }
})
