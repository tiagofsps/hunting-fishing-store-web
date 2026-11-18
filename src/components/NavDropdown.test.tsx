import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/renderWithProviders';
import NavDropdown, { NavMenuList, type NavLinkItem } from './NavDropdown';

const items: NavLinkItem[] = [
  { id: 1, label: 'Rods', to: '/shop?categoryId=1', meta: '4' },
  { id: 2, label: 'Reels', to: '/shop?categoryId=2', children: [{ id: 3, label: 'Spinning', to: '/shop?categoryId=3' }] },
];

describe('NavDropdown', () => {
  it('omits the dropdown trigger when there are no items', () => {
    renderWithProviders(<NavDropdown label="Shop" items={[]} />);
    expect(screen.queryByRole('button', { name: 'Shop' })).not.toBeInTheDocument();
  });

  it('opens and closes from its trigger and exposes its expanded state', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavDropdown label="Shop" items={items} />);
    const trigger = screen.getByRole('button', { name: 'Shop' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /Rods/ })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens with the keyboard and closes on Escape', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavDropdown label="Shop" items={items} />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Shop' })).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Shop' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes after a nested catalog link is activated', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavDropdown label="Shop" items={items} />);
    const trigger = screen.getByRole('button', { name: 'Shop' });
    await user.click(trigger);
    await user.click(screen.getByRole('link', { name: /Spinning/ }));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('NavMenuList', () => {
  it('calls its navigation callback and renders metadata and nested items', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    renderWithProviders(<NavMenuList items={items} onNavigate={onNavigate} />);

    await user.click(screen.getByRole('link', { name: /Rods/ }));
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: /Spinning/ })).toHaveAttribute('href', '/shop?categoryId=3');
  });
});
