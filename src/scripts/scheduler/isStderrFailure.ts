const isStderrFailure = (stderr: string): boolean => {
  const ret = stderr.trim();
  // eslint-disable-next-line no-restricted-syntax
  for (const line in ret.split('\n')) {
    if (line.startsWith('npm notice')) {
      // for example 'npm notice New minor version of npm available! 10.5.2 -> 10.7.0'
      // eslint-disable-next-line no-continue
      continue;
    }
    return true; // invalid line received
  }
  return !!ret;
};
export default isStderrFailure;
