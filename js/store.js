// On-device storage. Uses the browser's built-in database (IndexedDB), which can hold
// PDFs and images and keeps working offline. Falls back to memory if storage is blocked.
const Store = (() => {
  const STORES = ['bookings', 'trips', 'files', 'meta'];
  let db = null;
  let memory = null;

  function open() {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open('via', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('bookings', { keyPath: 'id' });
        d.createObjectStore('trips', { keyPath: 'id' });
        d.createObjectStore('files', { keyPath: 'id' }).createIndex('bookingId', 'bookingId');
        d.createObjectStore('meta', { keyPath: 'key' });
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  const req = (r) => new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  const store = (name, mode = 'readonly') => db.transaction(name, mode).objectStore(name);
  const keyOf = (value) => value.id ?? value.key;

  return {
    async init() {
      try {
        db = await open();
        navigator.storage?.persist?.().catch(() => {});
        return true;
      } catch {
        memory = Object.fromEntries(STORES.map((s) => [s, new Map()]));
        return false;
      }
    },
    async all(name) {
      return memory ? [...memory[name].values()] : req(store(name).getAll());
    },
    async get(name, key) {
      return memory ? memory[name].get(key) : req(store(name).get(key));
    },
    async put(name, value) {
      if (memory) return void memory[name].set(keyOf(value), value);
      return req(store(name, 'readwrite').put(value));
    },
    async remove(name, key) {
      if (memory) return void memory[name].delete(key);
      return req(store(name, 'readwrite').delete(key));
    },
  };
})();
