import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Link, Route, Routes } from 'react-router-dom';
import { AppShell } from './layouts/app-shell';
import { ProfileLayout } from '@/src/pages/profile/ui/profile-layout';
import { withTheme } from './providers/with-theme';
import { useAuthStore } from '@/src/shared/model/auth-store';
import { useThemeStore } from '@/src/shared/store/theme-store';

const renderShell = (initialEntry = '/profile') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route
            path="/"
            element={
              <div>
                <Link to="/profile">Go profile</Link>
                <section>Home content</section>
              </div>
            }
          />
          <Route path="/profile" element={<ProfileLayout />}>
            <Route index element={<div>Profile overview</div>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('App shell and profile inheritance', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'u_1',
        email: 'tester@example.com',
        name: 'Test User',
        role: 'USER',
        membershipPoints: 1200,
      },
      token: 'token',
      isHydrated: true,
    });

    useThemeStore.setState({ theme: 'dark', isHydrated: true });
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add('dark');
  });

  it('keeps the shared header and footer visible on /profile', async () => {
    renderShell();

    expect(screen.getByRole('link', { name: /tiệm bách hoá hai tụi mình/i })).toBeInTheDocument();
    expect(screen.getByText(/profile overview/i)).toBeInTheDocument();
    expect(screen.getByText(/powered by antigravity engine/i)).toBeInTheDocument();
  });

  it('restores focus to the shared main landmark after route changes', async () => {
    renderShell('/');

    fireEvent.click(screen.getByRole('link', { name: /go profile/i }));

    await waitFor(() => {
      expect(document.getElementById('app-main-content')).toHaveFocus();
    });
  });

  it('preserves dark theme state through the theme wrapper', () => {
    const Wrapped = withTheme(() => <div>Theme probe</div>);
    render(<Wrapped />);

    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByText('Theme probe')).toBeInTheDocument();
  });

  it('matches the dark-mode profile shell snapshot', () => {
    const { container } = renderShell();
    expect(container.firstChild).toMatchSnapshot();
  });
});
