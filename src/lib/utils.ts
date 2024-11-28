export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  export const timeSinceUpdate = (timestamp: string): string => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - updateTime.getTime()) / 1000);
  
    const days = Math.floor(diffInSeconds / 86400);
    const hours = Math.floor((diffInSeconds % 86400) / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
  
    let result = '';
    if (days > 0) result += `${days} ${days === 1 ? 'dzień' : 'dni'} `;
    if (hours > 0) result += `${hours} ${hours === 1 ? 'godzina' : 'godzin'} `;
    if (minutes > 0) result += `${minutes} ${minutes === 1 ? 'minuta' : 'minut'} `;
    if (result === '') result = 'mniej niż minutę ';
  
    return result.trim() + ' temu';
  };
  
  export const getWeekRange = (date: Date): { start: Date; end: Date } => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { start: startOfWeek, end: endOfWeek };
  };
  
  export const shouldShowNextWeek = (): boolean => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
  
    return (
      (currentDay === 5 && (currentHour > 21 || (currentHour === 21 && currentMinutes >= 15))) ||
      currentDay === 6 ||
      currentDay === 0
    );
  };
  
  export const convertTimeToMinutes = (timeString: string): number => {
    const cleanTimeString = timeString.replace(/<[^>]*>/g, '').trim();
    
    if (!cleanTimeString.includes(':')) {
      if (cleanTimeString.length === 3) {
        const hours = parseInt(cleanTimeString[0]);
        const minutes = parseInt(cleanTimeString.slice(1));
        return hours * 60 + minutes;
      } else if (cleanTimeString.length === 4) {
        const hours = parseInt(cleanTimeString.slice(0, 2));
        const minutes = parseInt(cleanTimeString.slice(2));
        return hours * 60 + minutes;
      }
    }
  
    const [hours, minutes] = cleanTimeString.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };
  
  export const formatMinutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  export const formatRelativeDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'dzisiaj';
    } else if (diffDays === 1) {
      return 'wczoraj';
    } else {
      return `${diffDays} dni temu`;
    }
  };