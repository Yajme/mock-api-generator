type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class LoggerService {
	private format(level: LogLevel, message: string, meta?: unknown): string {
		const timestamp = new Date().toISOString();
		const suffix = meta === undefined ? '' : ` ${this.stringify(meta)}`;

		return `[${timestamp}] [${level.toUpperCase()}] ${message}${suffix}`;
	}

	private stringify(value: unknown): string {
		if (typeof value === 'string') {
			return value;
		}

		try {
			return JSON.stringify(value);
		} catch {
			return String(value);
		}
	}

	debug(message: string, meta?: unknown): void {
		console.debug(this.format('debug', message, meta));
	}

	info(message: string, meta?: unknown): void {
		console.info(this.format('info', message, meta));
	}

	warn(message: string, meta?: unknown): void {
		console.warn(this.format('warn', message, meta));
	}

	error(message: string, meta?: unknown): void {
		console.error(this.format('error', message, meta));
	}
}

const logger = new LoggerService();

export { LoggerService, logger };
export default logger;
