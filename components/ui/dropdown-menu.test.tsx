import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from './dropdown-menu';
import '@testing-library/jest-dom';

describe('DropdownMenu', () => {
  it('renders trigger button', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <div>Menu Content</div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('shows menu content on trigger click', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <div>Menu Content</div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    fireEvent.click(screen.getByText('Menu'));
    expect(screen.getByText('Menu Content')).toBeInTheDocument();
  });
});
