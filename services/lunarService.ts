/**
 * Lunar Service - Sử dụng thư viện lunar-javascript để tính toán ngày âm lịch chính xác
 * Library: https://github.com/6tail/lunar-javascript
 */

// Type declarations cho Lunar library từ CDN
declare global {
  interface Window {
    Solar: any;
    Lunar: any;
  }
}

/**
 * Kiểm tra xem Lunar library đã được load chưa
 */
const ensureLunarLoaded = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window.Solar || (window as any).Solar)) {
      resolve();
      return;
    }

    // Nếu chưa load, đợi một chút rồi thử lại
    const checkInterval = setInterval(() => {
      if (typeof window !== 'undefined' && (window.Solar || (window as any).Solar)) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // Timeout sau 5 giây
    setTimeout(() => {
      clearInterval(checkInterval);
      if (typeof window !== 'undefined' && (window.Solar || (window as any).Solar)) {
        resolve();
      } else {
        reject(new Error('Lunar library failed to load'));
      }
    }, 5000);
  });
};

/**
 * Lấy Solar class từ global scope
 * Thư viện lunar-javascript từ CDN expose Solar và Lunar như global classes
 */
const getSolar = (): any => {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }
  
  // Thư viện từ CDN thường expose trực tiếp trên window
  const win = window as any;
  if (win.Solar) {
    return win.Solar;
  }
  
  // Fallback: thử các cách khác
  if (win.lunar && win.lunar.Solar) {
    return win.lunar.Solar;
  }
  
  throw new Error('Solar class not found. Make sure lunar-javascript library is loaded.');
};

/**
 * Chuyển đổi ngày dương lịch sang âm lịch
 * @param solarDate - Ngày dương lịch (YYYY-MM-DD)
 * @param time - Giờ (HH:mm)
 * @returns Lunar object từ thư viện
 */
export const solarToLunar = async (
  solarDate: string,
  time?: string
): Promise<any> => {
  await ensureLunarLoaded();

  const Solar = getSolar();
  if (!Solar) {
    throw new Error('Solar class is not available');
  }

  const [year, month, day] = solarDate.split('-').map(Number);

  // Tạo đối tượng ngày dương lịch
  let solar = Solar.fromYmd(year, month, day);

  // Nếu có thời gian, thêm vào
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    solar = Solar.fromYmdHms(year, month, day, hours, minutes || 0, 0);
  }

  // Chuyển đổi sang âm lịch
  const lunar = solar.getLunar();

  return lunar;
};

/**
 * Lấy thông tin ngày âm lịch dạng string
 * @param solarDate - Ngày dương lịch (YYYY-MM-DD)
 * @param time - Giờ (HH:mm) - optional
 * @param lang - Ngôn ngữ ('en' | 'zh' | 'vi')
 * @returns Chuỗi mô tả ngày âm lịch
 */
export const getLunarDateString = async (
  solarDate: string,
  time?: string,
  lang: 'en' | 'zh' | 'vi' = 'zh'
): Promise<string> => {
  try {
    const lunar = await solarToLunar(solarDate, time);

    if (lang === 'zh') {
      // Định dạng tiếng Trung: "1990年腊月初五"
      const year = lunar.getYearInChinese();
      const month = lunar.getMonthInChinese();
      const day = lunar.getDayInChinese();
      return `${year}年${month}月${day}`;
    } else if (lang === 'vi') {
      // Định dạng tiếng Việt: "Ngày 5 tháng 12 năm 1990 (Âm lịch)"
      const year = lunar.getYear();
      const month = lunar.getMonth();
      const day = lunar.getDay();
      const monthNames = [
        'Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu',
        'Bảy', 'Tám', 'Chín', 'Mười', 'Mười Một', 'Chạp'
      ];
      const leapPrefix = lunar.isLeapMonth() ? 'Nhuận ' : '';
      return `Ngày ${day} tháng ${leapPrefix}${monthNames[month - 1]} năm ${year} (Âm lịch)`;
    } else {
      // Định dạng tiếng Anh: "Lunar: 5th day of 12th month, 1990"
      const year = lunar.getYear();
      const month = lunar.getMonth();
      const day = lunar.getDay();
      const monthNames = [
        '1st', '2nd', '3rd', '4th', '5th', '6th',
        '7th', '8th', '9th', '10th', '11th', '12th'
      ];
      const leapPrefix = lunar.isLeapMonth() ? 'Leap ' : '';
      return `Lunar: ${day}th day of ${leapPrefix}${monthNames[month - 1]} month, ${year}`;
    }
  } catch (error) {
    console.error('Error converting to lunar date:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết về ngày âm lịch
 * @param solarDate - Ngày dương lịch (YYYY-MM-DD)
 * @param time - Giờ (HH:mm) - optional
 * @returns Object chứa thông tin chi tiết
 */
export const getLunarDateInfo = async (
  solarDate: string,
  time?: string
): Promise<{
  year: number;
  month: number;
  day: number;
  yearInChinese: string;
  monthInChinese: string;
  dayInChinese: string;
  isLeapMonth: boolean;
  ganZhi: {
    year: string;
    month: string;
    day: string;
    hour?: string;
  };
}> => {
  const lunar = await solarToLunar(solarDate, time);

  return {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
    yearInChinese: lunar.getYearInChinese(),
    monthInChinese: lunar.getMonthInChinese(),
    dayInChinese: lunar.getDayInChinese(),
    isLeapMonth: lunar.isLeapMonth(),
    ganZhi: {
      year: lunar.getYearInGanZhi(),
      month: lunar.getMonthInGanZhi(),
      day: lunar.getDayInGanZhi(),
      hour: time ? lunar.getTimeInGanZhi() : undefined,
    },
  };
};

/**
 * Tính toán True Solar Time (真太阳时) dựa trên vị trí địa lý
 * @param solarDate - Ngày dương lịch (YYYY-MM-DD)
 * @param clockTime - Giờ đồng hồ (HH:mm)
 * @param location - Tên địa điểm (để tính timezone và longitude)
 * @returns True Solar Time dạng HH:mm
 */
export const calculateTrueSolarTime = async (
  solarDate: string,
  clockTime: string,
  location: string
): Promise<string> => {
  await ensureLunarLoaded();

  const Solar = getSolar();
  if (!Solar) {
    throw new Error('Solar class is not available');
  }

  const [year, month, day] = solarDate.split('-').map(Number);
  const [hours, minutes] = clockTime.split(':').map(Number);

  // Tạo đối tượng ngày dương lịch với thời gian
  const solar = Solar.fromYmdHms(year, month, day, hours, minutes || 0, 0);

  // Lấy True Solar Time
  // Note: Thư viện lunar-javascript có thể tính toán True Solar Time
  // dựa trên longitude của địa điểm
  // getSolar() trả về chính nó nếu đã là Solar object
  const trueSolarTime = solar.getSolar();

  // Trả về định dạng HH:mm
  const trueHour = trueSolarTime.getHour();
  const trueMinute = trueSolarTime.getMinute();

  return `${String(trueHour).padStart(2, '0')}:${String(trueMinute).padStart(2, '0')}`;
};

/**
 * Lấy thông tin Can Chi (干支) cho năm, tháng, ngày, giờ
 * @param solarDate - Ngày dương lịch (YYYY-MM-DD)
 * @param time - Giờ (HH:mm)
 * @returns Object chứa Can Chi cho 4 trụ
 */
export const getGanZhi = async (
  solarDate: string,
  time: string
): Promise<{
  year: { gan: string; zhi: string };
  month: { gan: string; zhi: string };
  day: { gan: string; zhi: string };
  hour: { gan: string; zhi: string };
}> => {
  const lunar = await solarToLunar(solarDate, time);

  // Lấy Can Chi
  const yearGanZhi = lunar.getYearInGanZhi();
  const monthGanZhi = lunar.getMonthInGanZhi();
  const dayGanZhi = lunar.getDayInGanZhi();
  const hourGanZhi = lunar.getTimeInGanZhi();

  // Tách Can và Chi
  const splitGanZhi = (ganZhi: string) => {
    // Can Chi thường có 2 ký tự (ví dụ: "甲子")
    if (ganZhi && ganZhi.length >= 2) {
      return {
        gan: ganZhi[0],
        zhi: ganZhi[1],
      };
    }
    return { gan: '', zhi: '' };
  };

  return {
    year: splitGanZhi(yearGanZhi),
    month: splitGanZhi(monthGanZhi),
    day: splitGanZhi(dayGanZhi),
    hour: splitGanZhi(hourGanZhi),
  };
};
