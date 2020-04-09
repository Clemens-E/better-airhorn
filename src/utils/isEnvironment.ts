export function isDev(): boolean {
    return process.env.NODE_ENV !== 'production';
}

export function isProd(): boolean {
    return !isDev();
}
