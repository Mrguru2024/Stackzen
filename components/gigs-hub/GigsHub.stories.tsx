import React from 'react';
import GigsHub from './index.tsx';

const _mockGigs = [
  {
    id: '1',
    title: 'Frontend Developer',
    description: 'Build React apps.',
    url: 'https://example.com/1',
    source: 'WeWorkRemotely',
    category: 'Web Dev / Tech',
    postedAt: '2024-06-01T12:00:00Z',
  },
  {
    id: '2',
    title: 'Copywriter',
    description: 'Write great copy.',
    url: 'https://example.com/2',
    source: 'ProBlogger',
    category: 'Copywriting',
    postedAt: '2024-06-02T12:00:00Z',
  },
];

function mockFetch(data: any, delay = 0) {
  return jest.fn().mockImplementation(
    () =>
      new Promise(resolve =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              json: async () => data,
            }),
          delay
        )
      )
  );
}

export const _Loading = () => {
  global.fetch = jest.fn(() => new Promise(() => {}));
  return <GigsHub />;
};

export const _Empty = () => {
  global.fetch = mockFetch({ gigs: [], pagination: { pages: 1 } });
  return <GigsHub />;
};

export const _Populated = () => {
  global.fetch = mockFetch({ gigs: _mockGigs, pagination: { pages: 1 } });
  return <GigsHub />;
};

const stories = {
  _Loading,
  _Empty,
  _Populated,
};

export default stories;
