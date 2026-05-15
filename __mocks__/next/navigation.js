const _useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
});

const _usePathname = () => '/';

const _useSearchParams = () => new URLSearchParams();

const _redirect = jest.fn();

module.exports = {
  useRouter,
  usePathname,
  useSearchParams,
  redirect,
};
