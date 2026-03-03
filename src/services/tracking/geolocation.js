import { updateDriverLocation } from '../db/locations';

let activeWatcher = null;

export function startDriverTripTracking(driverId, vanId) {
  if (!navigator.geolocation) {
    throw new Error('Geolocation not supported');
  }

  if (activeWatcher !== null) {
    navigator.geolocation.clearWatch(activeWatcher);
  }

  activeWatcher = navigator.geolocation.watchPosition(
    (position) => {
      updateDriverLocation(driverId, {
        vanId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        isActiveTrip: true,
      });
    },
    (error) => {
      console.error('Location tracking error:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 2000,
    },
  );

  return activeWatcher;
}

export function stopDriverTripTracking(driverId, vanId) {
  if (activeWatcher !== null) {
    navigator.geolocation.clearWatch(activeWatcher);
    activeWatcher = null;
  }

  return updateDriverLocation(driverId, {
    vanId,
    isActiveTrip: false,
  });
}
