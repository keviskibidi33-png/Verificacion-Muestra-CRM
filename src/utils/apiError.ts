type FastApiValidationItem = {
    loc?: Array<string | number>;
    msg?: string;
};

const normalizeValidationLocation = (loc: Array<string | number> | undefined): string => {
    if (!Array.isArray(loc) || loc.length === 0) return '';
    const [first, ...rest] = loc;
    const normalized = first === 'body' ? rest : loc;
    return normalized.join('.');
};

export const getApiErrorMessage = (error: unknown, fallback = 'Ocurrió un error inesperado'): string => {
    const maybeError = error as any;
    const detail = maybeError?.response?.data?.detail;

    if (Array.isArray(detail)) {
        const messages = detail
            .map((item: FastApiValidationItem) => {
                const msg = typeof item?.msg === 'string' ? item.msg : '';
                const location = normalizeValidationLocation(item?.loc);
                if (location && msg) return `${location}: ${msg}`;
                return msg || '';
            })
            .filter(Boolean);

        if (messages.length > 0) {
            return messages.join(' | ');
        }
    }

    if (typeof detail === 'string' && detail.trim()) {
        return detail;
    }

    const message = maybeError?.response?.data?.message ?? maybeError?.message;
    if (typeof message === 'string' && message.trim()) {
        return message;
    }

    return fallback;
};

