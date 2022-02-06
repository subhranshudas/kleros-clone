const USER_TYPE = {
  NONE: 0,
  ADMIN: 1,
  CLIENT: 2,
  WORKER: 3,
  VOTER: 4
};

const unWrapAddress = (addr) => {
  if (Array.isArray(addr) && addr.length > 0) {
    const [_addr] = addr;
    return _addr?.toLowerCase();
  };
  return addr;
};

export default {
  unWrapAddress,
  USER_TYPE
};