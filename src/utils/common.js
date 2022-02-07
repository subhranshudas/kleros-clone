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

const PUBLIC_URLS = {
  TUTORIAL: "https://github.com/subhranshudas/kleros-clone/blob/main/readme.md#poc-scope"
};

export const displayAddress = (_addr) => {
  let addr;

  if (!_addr) {
    return '';
  }

  if (Array.isArray(_addr)) {
    addr = _addr[0];
  } else {
    addr = _addr || '';
  }

  const frags = [
    addr.substr(0, 15),
    '...',
    addr.substr(addr.length - 6, addr.length - 1)
  ];

  return frags.join('');
};

export default {
  unWrapAddress,
  USER_TYPE,
  PUBLIC_URLS,
  displayAddress
};