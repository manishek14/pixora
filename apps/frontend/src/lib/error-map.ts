// Maps backend/network errors to friendly Persian messages.
// Used by the Apollo ErrorLink and by auth pages.

// Patterns are matched case-insensitively against the raw error message.
// The first match wins; if no match, returns the generic fallback.
const ERROR_MAP: Array<{ test: RegExp; fa: string }> = [
  // Network-level
  { test: /failed to fetch/i, fa: 'ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.' },
  { test: /network error/i, fa: 'خطای شبکه. ممکن است سرور در دسترس نباشد.' },
  { test: /load failed/i, fa: 'بارگذاری پاسخ ناموفق بود. دوباره تلاش کنید.' },
  { test: /timeout|timed out/i, fa: 'پاسخ سرور بیش از حد طول کشید. دوباره تلاش کنید.' },

  // Auth — backend messages
  { test: /invalid credentials/i, fa: 'ایمیل یا رمز عبور اشتباه است.' },
  { test: /email or username already in use/i, fa: 'این ایمیل یا نام کاربری قبلاً ثبت شده است.' },
  { test: /session revoked/i, fa: 'نشست شما منقضی شده. لطفاً دوباره وارد شوید.' },
  { test: /invalid or expired refresh token/i, fa: 'نشست شما منقضی شده. لطفاً دوباره وارد شوید.' },
  { test: /user not found/i, fa: 'کاربر یافت نشد.' },
  { test: /unauthorized|401/i, fa: 'برای این عملیات باید وارد شوید.' },
  { test: /forbidden|403/i, fa: 'شما اجازهٔ انجام این عملیات را ندارید.' },

  // Validation
  { test: /password.*too short|password must be at least/i, fa: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' },
  { test: /invalid email/i, fa: 'فرمت ایمیل صحیح نیست.' },
  { test: /username.*already|username.*taken/i, fa: 'این نام کاربری قبلاً گرفته شده.' },

  // Posts / Comments
  { test: /post not found/i, fa: 'پست مورد نظر یافت نشد.' },
  { test: /comment not found/i, fa: 'کامنت مورد نظر یافت نشد.' },
  { test: /not the author|not.*owner/i, fa: 'شما مالک این محتوا نیستید.' },

  // Generic server
  { test: /internal server error|500/i, fa: 'خطای داخلی سرور. لطفاً بعداً تلاش کنید.' },
  { test: /bad request|400/i, fa: 'درخواست نامعتبر است.' },
  { test: /conflict|409/i, fa: 'تعارض با داده‌های موجود.' },
];

const FALLBACK_FA = 'خطایی رخ داد. لطفاً دوباره تلاش کنید.';

export function toPersianError(err: unknown): string {
  if (!err) return FALLBACK_FA;

  // Apollo wraps everything in `networkError` or `graphQLErrors[]`
  const anyErr = err as any;
  const messages: string[] = [];

  if (anyErr?.networkError?.message) {
    messages.push(String(anyErr.networkError.message));
    // Apollo sometimes adds `networkError.result.errors[]`
    if (Array.isArray(anyErr.networkError?.result?.errors)) {
      for (const e of anyErr.networkError.result.errors) {
        if (e?.message) messages.push(String(e.message));
      }
    }
  }
  if (Array.isArray(anyErr?.graphQLErrors)) {
    for (const e of anyErr.graphQLErrors) {
      if (e?.message) messages.push(String(e.message));
    }
  }
  if (anyErr?.message) messages.push(String(anyErr.message));

  const haystack = messages.join(' | ').toLowerCase();
  for (const { test, fa } of ERROR_MAP) {
    if (test.test(haystack)) return fa;
  }
  // If we have at least one real message, surface it (truncated)
  if (messages.length && messages[0] !== 'undefined') {
    const m = messages[0];
    return m.length > 200 ? m.slice(0, 200) + '…' : m;
  }
  return FALLBACK_FA;
}

// True if the error indicates the user must log in again (refresh failed)
export function isSessionError(err: unknown): boolean {
  const fa = toPersianError(err);
  return /منقضی|نشست|وارد شوید/i.test(fa);
}
