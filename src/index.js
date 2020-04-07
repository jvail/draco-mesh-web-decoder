import worker_str from './tmp/import-worker';
const getWorker = () => {
    const workerScript = URL.createObjectURL(new Blob([atob(worker_str)], { type: 'text/javascript' }));
    return new Worker(workerScript);
}
export default getWorker;
