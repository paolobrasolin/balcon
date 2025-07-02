declare module 'suncalc' {
  interface SunPosition {
    azimuth: number;
    altitude: number;
  }

  interface SunTimes {
    solarNoon: Date;
    nadir: Date;
    sunrise: Date;
    sunset: Date;
    sunriseEnd: Date;
    sunsetStart: Date;
    dawn: Date;
    dusk: Date;
    nauticalDawn: Date;
    nauticalDusk: Date;
    nightEnd: Date;
    night: Date;
    goldenHourEnd: Date;
    goldenHour: Date;
  }

  interface MoonPosition {
    azimuth: number;
    altitude: number;
    distance: number;
    parallacticAngle: number;
  }

  interface MoonTimes {
    rise: Date;
    set: Date;
    alwaysUp: boolean;
    alwaysDown: boolean;
  }

  export function getPosition(date: Date, lat: number, lng: number): SunPosition;
  export function getTimes(date: Date, lat: number, lng: number): SunTimes;
  export function getMoonPosition(date: Date, lat: number, lng: number): MoonPosition;
  export function getMoonTimes(date: Date, lat: number, lng: number): MoonTimes;
  export function getMoonIllumination(date: Date): {
    fraction: number;
    phase: number;
    angle: number;
  };
} 