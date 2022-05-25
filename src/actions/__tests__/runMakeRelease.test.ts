import { Tag } from '../../models/Tag';
import { MakeReleaseParams } from '../../services/makeRelease';
import { AssertToHaveBeenAnyNthCalledWithParams } from '../../testUtils';
import { Inputs } from '../../types';
import { runAction } from '../actionRunner';
import { assertGetInputIsCalled, assertSingleActionIsCalled } from './helpers';
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
        case Inputs.mainTag:
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

  it('when action name is makeRelease', async () => {
    mockedServiceLocator.makeRelease.mockReturnValueOnce(
      Promise.resolve(release),
    );
    await runAction({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      serviceLocator: mockedServiceLocator,
    });

    const params: MakeReleaseParams = {
      githubClient: mockedGithubClient,
      rowMainTag: mainTag.value,
      releasePrefix,
      rowMajorSegment: majorSegment,
      rowMinorSegment: minorSegment,
      push: false,
    };

    expect(mockedServiceLocator.makeRelease).toHaveBeenCalledWith(params);
    assertGetInputIsCalled(Inputs.releasePrefix, {
      required: true,
    });
    assertGetInputIsCalled(Inputs.mainTag, {
      required: true,
    });
    assertGetInputIsCalled(Inputs.minorSegment);
    assertGetInputIsCalled(Inputs.majorSegment);
    assertSingleActionIsCalled('makeRelease');
  });
  it('and informs about new release and outputs result', async () => {
    mockedServiceLocator.makeRelease.mockReturnValueOnce(
      Promise.resolve(release),
    );
    await runAction({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      serviceLocator: mockedServiceLocator,
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
        case Inputs.mainTag:
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
    await runAction({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      serviceLocator: mockedServiceLocator,
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
