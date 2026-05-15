import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './index.tsx';

describe('Table', () => {
  const _mockData = [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
    { id: 3, name: 'Item 3', value: 300 },
  ];

  it('renders table with all components', () => {
    render(
      <Table>
        <TableCaption>Test Table</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {_mockData.map(item => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell>600</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    // Check if all elements are rendered
    expect(screen.getByText('Test Table')).toBeInTheDocument();
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Table className="custom-table">
        <TableBody>
          <TableRow className="custom-row">
            <TableCell className="custom-cell">Test</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const table = screen.getByRole('table');
    const row = screen.getByRole('row');
    const cell = screen.getByText('Test');

    expect(table).toHaveClass('custom-table');
    expect(row).toHaveClass('custom-row');
    expect(cell).toHaveClass('custom-cell');
  });

  it('renders with correct semantic structure', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const table = screen.getByRole('table');
    const header = table.querySelector('thead');
    const body = table.querySelector('tbody');
    const _rows = screen.getAllByRole('row');

    expect(header).toBeInTheDocument();
    expect(body).toBeInTheDocument();
    expect(_rows).toHaveLength(2); // Header row + body row
  });

  // New test cases
  it('handles colspan attribute', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={2}>Spanned Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const cell = screen.getByText('Spanned Cell');
    expect(cell).toHaveAttribute('colspan', '2');
  });

  it('handles rowspan attribute', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell rowSpan={2}>Spanned Cell</TableCell>
            <TableCell>Cell 1</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Cell 2</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const cell = screen.getByText('Spanned Cell');
    expect(cell).toHaveAttribute('rowspan', '2');
  });

  it('handles scope attribute in header cells', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Column Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );

    const header = screen.getByText('Column Header');
    expect(header).toHaveAttribute('scope', 'col');
  });

  it('handles aria-label attribute', () => {
    render(
      <Table aria-label="Test Table">
        <TableBody>
          <TableRow>
            <TableCell>Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const table = screen.getByLabelText('Test Table');
    expect(table).toBeInTheDocument();
  });

  it('handles empty table state', () => {
    render(
      <Table>
        <TableCaption>Empty Table</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={1}>No data available</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('handles nested tables', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Nested Content</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const tables = screen.getAllByRole('table');
    expect(tables).toHaveLength(2);
    expect(screen.getByText('Nested Content')).toBeInTheDocument();
  });
});
