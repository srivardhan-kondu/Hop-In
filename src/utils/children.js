export function newChildRecord(child) {
  return {
    childId: crypto.randomUUID(),
    name: child.name,
    age: Number(child.age),
    schoolName: child.schoolName,
    homeAddress: {
      street: child.street,
      latitude: Number(child.latitude),
      longitude: Number(child.longitude),
    },
    qrCode: crypto.randomUUID(),
    activeBookingId: null,
    activeVanId: null,
    activeDriverId: null,
  };
}
