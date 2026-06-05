const STATUS_DOT_STYLES = {
    connected: 'background-color: #8ff0a4;',
    disconnected: 'background-color: #f66151;',
    transitioning: 'background-color: #f9f06b;',
    error: 'background-color: #ff7800;'
};

export function statusDotStyle(state) {
    const colorStyle = STATUS_DOT_STYLES[state] || STATUS_DOT_STYLES.disconnected;
    return `width: 10px; height: 10px; border-radius: 999px; ${colorStyle}`;
}

export function statusDotState({connected = false, transitioning = false, error = false} = {}) {
    if (error) return 'error';
    if (transitioning) return 'transitioning';
    if (connected) return 'connected';
    return 'disconnected';
}
