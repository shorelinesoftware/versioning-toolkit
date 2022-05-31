import { Tag } from '../../models/Tag';
import { AssertToHaveBeenAnyNthCalledWithParams } from '../../testUtils';
import { Inputs } from '../../types';
import { makeRelease } from '../makeRelease';
import {
  mockedActionAdapter,
  mockedServiceLocator,
  mockedGithubClient,
} from './mocks';

function assertOutputIsCorrect({
  newReleaseTag,
  newReleaseBranch,
  newMainTag,
}: {
  newReleaseTag: Tag;
  newMainTag: Tag;
  newReleaseBranch: string;
}) {
  AssertToHaveBeenAnyNthCalledWithParams(
    mockedActionAdapter.setOutput,
    'NEW_RELEASE_TAG',
    newReleaseTag.value,
  );
  AssertToHaveBeenAnyNthCalledWithParams(
    mockedActionAdapter.setOutput,
    'NEW_RELEASE_BRANCH',
    newReleaseBranch,
  );
  AssertToHaveBeenAnyNthCalledWithParams(
    mockedActionAdapter.setOutput,
    'NEW_MAIN_TAG',
    newMainTag.value,
  );
}

describe('runs makeRelease', () => {
  const mainTag = new Tag('master-1.0.0');
  const releasePrefix = 'stable';
  const majorSegment = '1';
  const minorSegment = '1';
  beforeAll(() => {
    mockedActionAdapter.getInput.mockImplementation((name) => {
      switch (name as Inputs) {
        case Inputs.actionName:
          return 'makeRelease';
        case Inputs.tag:
          return mainTag.value;
        case Inputs.releasePrefix:
          return releasePrefix;
        case Inputs.push:
          return '';
        case Inputs.majorSegment:
          return majorSegment;
        case Inputs.minorSegment:
          return minorSegment;
        default:
          throw new Error('Input not found');
      }
    });
  });
  const release = {
    newReleaseTag: new Tag('stable-1.0.0'),
    newMainTag: mainTag,
    newReleaseBranch: 'stable-1.0',
  };

  it('and informs about new release and outputs result', async () => {
    mockedServiceLocator.makeRelease.mockReturnValueOnce(
      Promise.resolve(release),
    );
    await makeRelease({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      makeReleaseService: mockedServiceLocator.makeRelease,
    });
    expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
      1,
      `new release tag ${release.newReleaseTag}`,
    );
    expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
      2,
      `new release branch ${release.newReleaseBranch}`,
    );
    expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
      3,
      `new main tag ${release.newMainTag}`,
    );
    assertOutputIsCorrect(release);
  });
  it('and informs about if changes were pushed', async () => {
    mockedServiceLocator.makeRelease.mockReturnValueOnce(
      Promise.resolve(release),
    );
    mockedActionAdapter.getInput.mockImplementation((name) => {
      switch (name as Inputs) {
        case Inputs.actionName:
          return 'makeRelease';
        case Inputs.tag:
          return mainTag.value;
        case Inputs.releasePrefix:
          return releasePrefix;
        case Inputs.push:
          return 'true';
        case Inputs.majorSegment:
          return majorSegment;
        case Inputs.minorSegment:
          return minorSegment;
        default:
          throw new Error('Input not found');
      }
    });
    await makeRelease({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      makeReleaseService: mockedServiceLocator.makeRelease,
    });
    expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
      1,
      `new release tag ${release.newReleaseTag}`,
    );
    expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
      2,
      `new release branch ${release.newReleaseBranch}`,
    );
    expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
      3,
      `new main tag ${release.newMainTag}`,
    );
    expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
      4,
      `changes pushed to repository`,
    );
    assertOutputIsCorrect(release);
  });
});
