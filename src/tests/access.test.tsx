import { TextEncoder } from 'node:util';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AccessEntry from '../app/AccessEntry';
import {
  ROLE_KEY,
  RoleContext,
  readSessionRole,
  useRole,
  verifyMentorCode,
  writeSessionRole,
} from '../app/access';

// Synthetic attempts below are deliberately unrelated to the deployment access code.
// Mock only WebCrypto's result so the real comparison and form lifecycle still run.
const acceptedHash = 'bda6fa59e461716eb787b554811ab1af2839461e3e53b70015e2ecaea7bb1387';
function acceptedDigest() {
  return Uint8Array.from(acceptedHash.match(/../g)!, (pair) => Number.parseInt(pair, 16)).buffer;
}

const digest = vi.fn<SubtleCrypto['digest']>();

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  digest.mockReset().mockResolvedValue(new Uint8Array(32).buffer);
  vi.stubGlobal('crypto', { subtle: { digest } });
  vi.stubGlobal('TextEncoder', TextEncoder);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('session access roles', () => {
  it('has no role in a new session', () => {
    expect(ROLE_KEY).toBe('pmh-role');
    expect(readSessionRole()).toBeNull();
  });

  it.each(['mentor', 'mentee'] as const)('restores the allowed %s role', (role) => {
    sessionStorage.setItem(ROLE_KEY, role);
    expect(readSessionRole()).toBe(role);
  });

  it.each(['admin', 'MENTOR', 'mentor\n', ' mentee', '', '{"role":"mentor"}'])(
    'rejects an unrecognized stored value: %j',
    (value) => {
      sessionStorage.setItem(ROLE_KEY, value);
      expect(readSessionRole()).toBeNull();
    },
  );

  it('writes and clears only the session role, preserving unrelated browser data', () => {
    sessionStorage.setItem('unrelated-session', 'keep-session');
    localStorage.setItem('unrelated-local', 'keep-local');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');
    const clear = vi.spyOn(Storage.prototype, 'clear');

    writeSessionRole('mentor');
    expect(readSessionRole()).toBe('mentor');
    writeSessionRole('mentee');
    expect(readSessionRole()).toBe('mentee');
    writeSessionRole(null);

    expect(readSessionRole()).toBeNull();
    expect(setItem.mock.calls).toEqual([
      [ROLE_KEY, 'mentor'],
      [ROLE_KEY, 'mentee'],
    ]);
    expect(setItem.mock.contexts).toEqual([sessionStorage, sessionStorage]);
    expect(removeItem.mock.calls).toEqual([[ROLE_KEY]]);
    expect(removeItem.mock.contexts).toEqual([sessionStorage]);
    expect(clear).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('unrelated-session')).toBe('keep-session');
    expect(localStorage.getItem('unrelated-local')).toBe('keep-local');
    expect(localStorage.getItem(ROLE_KEY)).toBeNull();
  });

  it('tolerates browser policy denying access to session storage', () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new DOMException('Storage denied', 'SecurityError');
    });

    expect(readSessionRole()).toBeNull();
    expect(() => writeSessionRole('mentor')).not.toThrow();
    expect(() => writeSessionRole(null)).not.toThrow();
  });

  it('tolerates storage operations failing after access was granted', () => {
    const unavailable = () => {
      throw new DOMException('Storage unavailable', 'QuotaExceededError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(unavailable);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(unavailable);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(unavailable);

    expect(readSessionRole()).toBeNull();
    expect(() => writeSessionRole('mentee')).not.toThrow();
    expect(() => writeSessionRole(null)).not.toThrow();
  });

  it('exposes the current role through the shared context', () => {
    function CurrentRole() {
      const { role } = useRole();
      return <output aria-label="Current role">{role ?? 'none'}</output>;
    }
    const { rerender } = render(<CurrentRole />);
    expect(screen.getByLabelText('Current role')).toHaveTextContent('none');
    rerender(
      <RoleContext.Provider value={{ role: 'mentor' }}>
        <CurrentRole />
      </RoleContext.Provider>,
    );
    expect(screen.getByLabelText('Current role')).toHaveTextContent('mentor');
    rerender(
      <RoleContext.Provider value={{ role: 'mentee' }}>
        <CurrentRole />
      </RoleContext.Provider>,
    );
    expect(screen.getByLabelText('Current role')).toHaveTextContent('mentee');
  });
});

describe('local mentor code verification', () => {
  it('accepts only the expected SHA-256 digest of the exact supplied input', async () => {
    digest.mockResolvedValueOnce(acceptedDigest());
    await expect(verifyMentorCode('synthetic-valid-attempt')).resolves.toBe(true);
    expect(digest).toHaveBeenCalledExactlyOnceWith(
      'SHA-256',
      new TextEncoder().encode('synthetic-valid-attempt'),
    );
  });

  it('rejects a different digest without storing or transmitting the attempted code', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');
    await expect(verifyMentorCode('synthetic-wrong-attempt')).resolves.toBe(false);
    expect(digest).toHaveBeenCalledExactlyOnceWith(
      'SHA-256',
      new TextEncoder().encode('synthetic-wrong-attempt'),
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });

  it('rejects safely when WebCrypto is unavailable', async () => {
    vi.stubGlobal('crypto', {});
    await expect(verifyMentorCode('synthetic-attempt')).resolves.toBe(false);
  });

  it('rejects safely when the digest operation fails', async () => {
    digest.mockRejectedValueOnce(new Error('Digest failed'));
    await expect(verifyMentorCode('synthetic-attempt')).resolves.toBe(false);
  });
});

describe('access entry', () => {
  it('offers the two access choices and enters student mode without a code', async () => {
    const user = userEvent.setup();
    const onEnter = vi.fn();
    render(<AccessEntry onEnter={onEnter} />);

    expect(screen.getByRole('heading', { level: 1, name: 'SFU Peer Mentor Hub' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Choose your access' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Peer Mentor' })).toBeVisible();
    expect(screen.queryByLabelText('Access Code')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mentee / Student' }));

    expect(onEnter).toHaveBeenCalledExactlyOnceWith('mentee');
    expect(digest).not.toHaveBeenCalled();
  });

  it('uses a password field, rejects a wrong code, and clears the attempt and error on editing', async () => {
    const user = userEvent.setup();
    const onEnter = vi.fn();
    render(<AccessEntry onEnter={onEnter} />);
    await user.click(screen.getByRole('button', { name: 'Peer Mentor' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Mentor Access' })).toBeVisible();
    const input = screen.getByLabelText('Access Code');
    expect(input).toHaveAttribute('type', 'password');
    await user.type(input, 'synthetic-wrong-attempt');
    await user.click(screen.getByRole('button', { name: 'Enter Hub' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect access code.');
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(onEnter).not.toHaveBeenCalled();
    await user.type(input, 'another-synthetic-attempt');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('enters mentor mode after a matching digest and clears the typed code', async () => {
    const user = userEvent.setup();
    const onEnter = vi.fn();
    digest.mockResolvedValueOnce(acceptedDigest());
    render(<AccessEntry onEnter={onEnter} />);
    await user.click(screen.getByRole('button', { name: 'Peer Mentor' }));
    await user.type(screen.getByLabelText('Access Code'), 'synthetic-valid-attempt');
    await user.click(screen.getByRole('button', { name: 'Enter Hub' }));

    expect(onEnter).toHaveBeenCalledExactlyOnceWith('mentor');
    expect(screen.getByLabelText('Access Code')).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('returns to the choices with Back and clears previous code and error when reopened', async () => {
    const user = userEvent.setup();
    render(<AccessEntry onEnter={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Peer Mentor' }));
    await user.type(screen.getByLabelText('Access Code'), 'synthetic-wrong-attempt');
    await user.click(screen.getByRole('button', { name: 'Enter Hub' }));
    expect(await screen.findByRole('alert')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('heading', { name: 'Choose your access' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Peer Mentor' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Access Code')).toHaveValue('');

    await user.type(screen.getByLabelText('Access Code'), 'unfinished-synthetic-attempt');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'Peer Mentor' }));
    expect(screen.getByLabelText('Access Code')).toHaveValue('');
  });

  it.each([true, false])(
    'ignores a pending %s verification result after Back, including after reopening the form',
    async (accepted) => {
      const user = userEvent.setup();
      const onEnter = vi.fn();
      let finish!: (value: ArrayBuffer) => void;
      const pending = new Promise<ArrayBuffer>((resolve) => {
        finish = resolve;
      });
      digest.mockReturnValueOnce(pending);
      render(<AccessEntry onEnter={onEnter} />);
      await user.click(screen.getByRole('button', { name: 'Peer Mentor' }));
      await user.type(screen.getByLabelText('Access Code'), 'pending-synthetic-attempt');
      await user.click(screen.getByRole('button', { name: 'Enter Hub' }));
      expect(screen.getByRole('button', { name: 'Enter Hub' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled();
      await user.click(screen.getByRole('button', { name: 'Back' }));
      expect(screen.getByRole('heading', { name: 'Choose your access' })).toBeVisible();
      await user.click(screen.getByRole('button', { name: 'Peer Mentor' }));
      await user.type(screen.getByLabelText('Access Code'), 'new-synthetic-attempt');

      await act(async () => {
        finish(accepted ? acceptedDigest() : new Uint8Array(32).buffer);
        await pending;
      });

      expect(onEnter).not.toHaveBeenCalled();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Access Code')).toHaveValue('new-synthetic-attempt');
      expect(screen.getByRole('button', { name: 'Enter Hub' })).toBeEnabled();

      digest.mockResolvedValueOnce(acceptedDigest());
      await user.click(screen.getByRole('button', { name: 'Enter Hub' }));
      expect(onEnter).toHaveBeenCalledExactlyOnceWith('mentor');
    },
  );
});
