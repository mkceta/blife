import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isWeb = Capacitor.getPlatform() === 'web';

export const simpleHaptic = async () => {
    // Light impact for standard buttons (Selection)
    await Haptics.impact({ style: ImpactStyle.Light });
};

export const mediumHaptic = async () => {
    // Medium impact for distinct actions (Tabs, Important Buttons)
    await Haptics.impact({ style: ImpactStyle.Medium });
};

export const successHaptic = async () => {
    // Notification Success (Form submit, etc)
    await Haptics.notification({ type: NotificationType.Success });
};

export const errorHaptic = async () => {
    // Notification Error
    await Haptics.notification({ type: NotificationType.Error });
};

export const selectionHaptic = async () => {
    // Very light touch for scrolling pickers or subtle changes
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
};
