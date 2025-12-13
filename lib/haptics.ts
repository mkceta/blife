import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isWeb = Capacitor.getPlatform() === 'web';
const isNative = !isWeb;

// Helper function to safely execute haptics only on native platforms
const safeHaptic = async (fn: () => Promise<void>) => {
    if (isNative) {
        try {
            await fn();
        } catch (error) {
            // Silently fail on platforms that don't support haptics
            console.debug('Haptic feedback not available:', error);
        }
    }
};

// Helper to create delays between haptic pulses
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// BASIC HAPTICS (Existing, improved)
// ============================================================================

/**
 * Light tap - For subtle interactions like hovering or selecting items
 * Use: Tab changes, filter selections, checkbox toggles
 */
export const lightHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
    });
};

/**
 * Medium tap - For standard interactions
 * Use: Button presses, navigation, opening modals
 */
export const mediumHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
    });
};

/**
 * Heavy tap - For important actions
 * Use: Delete actions, important confirmations
 */
export const heavyHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Heavy });
    });
};

// Legacy alias for backwards compatibility
export const simpleHaptic = lightHaptic;

// ============================================================================
// NOTIFICATION HAPTICS
// ============================================================================

/**
 * Success notification - Single satisfying pulse
 * Use: Form submitted, item saved, action completed
 */
export const successHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.notification({ type: NotificationType.Success });
    });
};

/**
 * Warning notification - Attention-grabbing pulse
 * Use: Confirmation dialogs, destructive actions
 */
export const warningHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.notification({ type: NotificationType.Warning });
    });
};

/**
 * Error notification - Sharp, alerting pulse
 * Use: Form errors, failed actions, validation errors
 */
export const errorHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.notification({ type: NotificationType.Error });
    });
};

// ============================================================================
// SELECTION HAPTICS
// ============================================================================

/**
 * Selection changed - Subtle feedback for continuous selection
 * Use: Scrolling through pickers, sliders, step-by-step navigation
 */
export const selectionHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.selectionStart();
        await Haptics.selectionChanged();
        await Haptics.selectionEnd();
    });
};

/**
 * Single selection tick - Quick feedback for discrete selections
 * Use: Radio buttons, single-select lists
 */
export const selectionTickHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.selectionChanged();
    });
};

// ============================================================================
// EMOTIONAL PATTERNS (New!)
// ============================================================================

/**
 * 🎉 Celebration - Triple pulse with increasing intensity
 * Pattern: Light → Medium → Medium (joy, achievement)
 * Use: First post created, sale completed, milestone reached
 */
export const celebrationHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
        await delay(100);
        await Haptics.impact({ style: ImpactStyle.Medium });
        await delay(80);
        await Haptics.impact({ style: ImpactStyle.Medium });
    });
};

/**
 * ❤️ Like/Love - Quick double tap with satisfaction
 * Pattern: Medium → Light (affection, appreciation)
 * Use: Liking a post, adding to wishlist, favoriting
 */
export const likeHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
        await delay(60);
        await Haptics.impact({ style: ImpactStyle.Light });
    });
};

/**
 * 💔 Unlike - Single soft tap (neutral, undoing)
 * Pattern: Light (subtle, non-emotional)
 * Use: Removing from wishlist, unfavoriting
 */
export const unlikeHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
    });
};

/**
 * 📤 Send/Share - Quick ascending pattern
 * Pattern: Light → Medium (action, momentum)
 * Use: Sending message, sharing content, publishing
 */
export const sendHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
        await delay(50);
        await Haptics.impact({ style: ImpactStyle.Medium });
    });
};

/**
 * 🗑️ Delete - Double heavy tap (warning, destruction)
 * Pattern: Heavy → Heavy (serious, irreversible)
 * Use: Deleting items, removing content
 */
export const deleteHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await delay(100);
        await Haptics.impact({ style: ImpactStyle.Heavy });
    });
};

/**
 * ↩️ Undo - Reverse pattern (going back)
 * Pattern: Medium → Light (reversal, stepping back)
 * Use: Undo actions, going back, canceling
 */
export const undoHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
        await delay(60);
        await Haptics.impact({ style: ImpactStyle.Light });
    });
};

/**
 * 🔄 Refresh - Circular pattern (renewal, reload)
 * Pattern: Light → Light → Light (continuous, refreshing)
 * Use: Pull-to-refresh, reload data
 */
export const refreshHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
        await delay(50);
        await Haptics.impact({ style: ImpactStyle.Light });
        await delay(50);
        await Haptics.impact({ style: ImpactStyle.Light });
    });
};

/**
 * 📸 Capture - Camera shutter feel
 * Pattern: Medium (instant, decisive)
 * Use: Taking photos, screenshots, capturing moment
 */
export const captureHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
    });
};

/**
 * 🎯 Target Hit - Satisfying confirmation
 * Pattern: Light → Heavy (precision, achievement)
 * Use: Reaching goal, hitting target, completing challenge
 */
export const targetHitHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
        await delay(40);
        await Haptics.impact({ style: ImpactStyle.Heavy });
    });
};

/**
 * 🔔 Notification Received - Gentle alert
 * Pattern: Medium → Light (attention, non-intrusive)
 * Use: New message, new notification
 */
export const notificationReceivedHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
        await delay(100);
        await Haptics.impact({ style: ImpactStyle.Light });
    });
};

/**
 * ⚡ Quick Action - Snappy response
 * Pattern: Light (fast, responsive)
 * Use: Quick replies, instant actions, shortcuts
 */
export const quickActionHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
    });
};

/**
 * 🎊 Big Win - Extended celebration
 * Pattern: Medium → Heavy → Heavy → Medium (euphoria, major achievement)
 * Use: Major milestones, big sales, achievements unlocked
 */
export const bigWinHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
        await delay(80);
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await delay(60);
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await delay(80);
        await Haptics.impact({ style: ImpactStyle.Medium });
    });
};

/**
 * 💫 Magical Moment - Whimsical pattern
 * Pattern: Light → Light → Medium (delight, surprise)
 * Use: Easter eggs, special features, delightful discoveries
 */
export const magicalHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
        await delay(40);
        await Haptics.impact({ style: ImpactStyle.Light });
        await delay(40);
        await Haptics.impact({ style: ImpactStyle.Medium });
    });
};

/**
 * ⚠️ Boundary Hit - Gentle resistance
 * Pattern: Medium (limit reached, can't go further)
 * Use: Scroll to end, max value reached, boundary hit
 */
export const boundaryHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
    });
};

/**
 * 🔓 Unlock - Satisfying release
 * Pattern: Light → Medium → Heavy (progression, opening)
 * Use: Unlocking features, revealing content, opening doors
 */
export const unlockHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
        await delay(50);
        await Haptics.impact({ style: ImpactStyle.Medium });
        await delay(50);
        await Haptics.impact({ style: ImpactStyle.Heavy });
    });
};

// ============================================================================
// GESTURE HAPTICS
// ============================================================================

/**
 * Swipe Start - Initiating a swipe gesture
 * Use: Beginning of swipe-to-delete, swipe-to-reply
 */
export const swipeStartHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
    });
};

/**
 * Swipe Threshold - Reached the action threshold
 * Use: When swipe distance is enough to trigger action
 */
export const swipeThresholdHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
    });
};

/**
 * Long Press Start - Beginning of long press
 * Use: When long press is detected
 */
export const longPressStartHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
    });
};

/**
 * Drag Start - Beginning of drag operation
 * Use: Starting to drag an item
 */
export const dragStartHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
    });
};

/**
 * Drop - Completing a drag-and-drop
 * Use: Dropping an item in place
 */
export const dropHaptic = async () => {
    await safeHaptic(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
    });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if haptics are available on this device
 */
export const isHapticsAvailable = () => {
    return isNative && Capacitor.isPluginAvailable('Haptics');
};

/**
 * Custom haptic pattern - for advanced use cases
 * @param pattern Array of {style, delay} objects
 * @example
 * customHaptic([
 *   { style: ImpactStyle.Light, delay: 0 },
 *   { style: ImpactStyle.Medium, delay: 100 },
 *   { style: ImpactStyle.Heavy, delay: 50 }
 * ])
 */
export const customHaptic = async (
    pattern: Array<{ style: ImpactStyle; delay: number }>
) => {
    await safeHaptic(async () => {
        for (const { style, delay: delayMs } of pattern) {
            if (delayMs > 0) await delay(delayMs);
            await Haptics.impact({ style });
        }
    });
};

// ============================================================================
// EXPORTS
// ============================================================================

export { ImpactStyle, NotificationType } from '@capacitor/haptics';
