import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { server } from '../../../test/server';
import { renderWithProviders } from '../../../test/renderWithProviders';
import AdminProductFormPage from './AdminProductFormPage';

const CATEGORIES = [{ id: 3, name: 'Rods', slug: 'rods' }];
const BRANDS = [{ id: 7, name: 'Shimano', slug: 'shimano' }];

interface RequestLog {
  method: string;
  url: string;
  body: unknown;
}

/** Stored product used by the edit tests; its inferred type is the JSON shape the mock serves. */
const EDIT_PRODUCT = {
  id: 5,
  name: 'Old Rod',
  slug: 'old-rod',
  categoryId: 3,
  brandId: 7,
  requiresLicense: false,
  translations: { en: { name: 'Old Rod', description: 'Desc' }, pt: { name: 'Cana Antiga' } },
  items: [
    {
      id: 11,
      sku: 'OLD-1',
      price: 50,
      stockQuantity: 2,
      active: true,
      attributes: { size: 'Medium', color: 'yellow' },
    },
  ],
  images: [],
};

/** Builds the response shape `mapProduct` expects, echoing the saved values back. */
function productResponse(id: number, body: Record<string, unknown>) {
  return {
    id,
    name: String(body.name ?? ''),
    slug: String(body.slug ?? ''),
    description: body.description ? String(body.description) : null,
    requiresLicense: body.requiresLicense === true,
    licenseType: body.licenseType ? String(body.licenseType) : null,
    categoryId: Number(body.categoryId),
    brandId: Number(body.brandId),
    translations: {},
    items: [],
    images: [],
  };
}

/** Installs reference-data handlers and records every write request. */
function installApi({ product }: { product?: typeof EDIT_PRODUCT } = {}) {
  const writes: RequestLog[] = [];
  server.use(
    http.get('/api/v1/categories', () => HttpResponse.json(CATEGORIES)),
    http.get('/api/v1/brands', () => HttpResponse.json(BRANDS)),
    http.get('/api/v1/products/:id', () => HttpResponse.json(product)),
    http.post('/api/v1/products', async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      writes.push({ method: 'POST', url: request.url, body });
      return HttpResponse.json(productResponse(99, body), { status: 201 });
    }),
    http.put('/api/v1/products/:id', async ({ request, params }) => {
      const body = (await request.json()) as Record<string, unknown>;
      writes.push({ method: 'PUT', url: request.url, body });
      return HttpResponse.json(productResponse(Number(params.id), body));
    })
  );
  return writes;
}

function renderAt(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/products/new" element={<AdminProductFormPage />} />
      <Route path="/admin/products/:id/edit" element={<AdminProductFormPage />} />
      <Route path="/admin/products" element={<p>Product list</p>} />
    </Routes>,
    { route }
  );
}

async function fillValidBasics(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText('Name (EN)'), 'Carbon Rod');
  await user.type(screen.getByLabelText('Slug'), 'carbon-rod');
  await user.selectOptions(screen.getByLabelText('Category'), '3');
  await user.selectOptions(screen.getByLabelText('Brand'), '7');
}

async function fillFirstVariant(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('SKU'), 'ROD-1');
  await user.clear(screen.getByLabelText('Price'));
  await user.type(screen.getByLabelText('Price'), '129.9');
  await user.clear(screen.getByLabelText('Stock'));
  await user.type(screen.getByLabelText('Stock'), '4');
}

describe('AdminProductFormPage: create', () => {
  it('starts with one empty variant and an empty images list', async () => {
    installApi();
    renderAt('/admin/products/new');

    expect(await screen.findByRole('heading', { name: 'New product' })).toBeInTheDocument();
    expect(screen.getAllByLabelText('SKU')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('does not submit when required fields are missing', async () => {
    const writes = installApi();
    const user = userEvent.setup();
    renderAt('/admin/products/new');
    await screen.findByRole('heading', { name: 'New product' });

    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect((await screen.findAllByText('Something went wrong:')).length).toBeGreaterThan(0);
    expect(writes).toHaveLength(0);
  });

  it('rejects a slug that is not lowercase kebab-case', async () => {
    const writes = installApi();
    const user = userEvent.setup();
    renderAt('/admin/products/new');
    await fillValidBasics(user);
    await user.clear(screen.getByLabelText('Slug'));
    await user.type(screen.getByLabelText('Slug'), 'Carbon Rod!');
    await fillFirstVariant(user);

    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect(await screen.findByText('Use lowercase letters, numbers and dashes only')).toBeInTheDocument();
    expect(writes).toHaveLength(0);
  });

  it('creates the product with the entered values and returns to the list', async () => {
    const writes = installApi();
    const user = userEvent.setup();
    renderAt('/admin/products/new');
    await fillValidBasics(user);
    await fillFirstVariant(user);

    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect(await screen.findByText('Product list')).toBeInTheDocument();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      method: 'POST',
      body: expect.objectContaining({
        name: 'Carbon Rod',
        slug: 'carbon-rod',
        categoryId: 3,
        brandId: 7,
      }),
    });
    expect(writes[0].body).toMatchObject({
      items: [expect.objectContaining({ sku: 'ROD-1', price: 129.9, stockQuantity: 4 })],
    });
  });

  it('saves without a weight, which is optional', async () => {
    const writes = installApi();
    const user = userEvent.setup();
    renderAt('/admin/products/new');
    await fillValidBasics(user);
    await fillFirstVariant(user);

    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect(await screen.findByText('Product list')).toBeInTheDocument();
    expect(writes).toHaveLength(1);
    const body = writes[0].body as { items: { sku: string; weight?: number }[] };
    expect(body.items[0].sku).toBe('ROD-1');
    expect(body.items[0].weight).toBeUndefined();
  });

  it('shows a message on the variant field that is invalid', async () => {
    const writes = installApi();
    const user = userEvent.setup();
    renderAt('/admin/products/new');
    await fillValidBasics(user);
    await fillFirstVariant(user);
    await user.clear(screen.getByLabelText('Price'));

    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect((await screen.findAllByText('Something went wrong:')).length).toBeGreaterThan(0);
    expect(writes).toHaveLength(0);
  });

  it('requires a licence type when the product requires a licence', async () => {
    const writes = installApi();
    const user = userEvent.setup();
    renderAt('/admin/products/new');
    await fillValidBasics(user);
    await fillFirstVariant(user);

    await user.click(screen.getByLabelText('Requires licence'));
    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect(await screen.findByText('A licence type is required')).toBeInTheDocument();
    expect(writes).toHaveLength(0);
  });
});

describe('AdminProductFormPage: variants and images', () => {
  it('adds and removes variant rows, keeping at least one', async () => {
    installApi();
    const user = userEvent.setup();
    renderAt('/admin/products/new');
    await screen.findByRole('heading', { name: 'New product' });

    await user.click(screen.getByRole('button', { name: 'Add variant' }));
    expect(screen.getAllByLabelText('SKU')).toHaveLength(2);

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    await user.click(removeButtons[0]);
    expect(screen.getAllByLabelText('SKU')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('adds and removes image rows', async () => {
    installApi();
    const user = userEvent.setup();
    renderAt('/admin/products/new');
    await screen.findByRole('heading', { name: 'New product' });

    await user.click(screen.getByRole('button', { name: 'Add image' }));
    expect(screen.getByLabelText('Image URL')).toBeInTheDocument();

    const imageSection = screen.getByLabelText('Image URL').closest('li') as HTMLElement;
    await user.click(within(imageSection).getByRole('button', { name: 'Remove' }));
    expect(screen.queryByLabelText('Image URL')).not.toBeInTheDocument();
  });
});

describe('AdminProductFormPage: edit', () => {
  it('prefills the form from the stored product, including attributes', async () => {
    installApi({ product: EDIT_PRODUCT });
    renderAt('/admin/products/5/edit');

    expect(await screen.findByRole('heading', { name: 'Edit product' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name (EN)')).toHaveValue('Old Rod');
    expect(screen.getByLabelText('Name (PT)')).toHaveValue('Cana Antiga');
    expect(screen.getByLabelText('SKU')).toHaveValue('OLD-1');
    expect(screen.getByLabelText(/^Attributes/)).toHaveValue('size=Medium, color=yellow');
  });

  it('saves edited attributes back in the parsed format', async () => {
    const writes = installApi({ product: EDIT_PRODUCT });
    const user = userEvent.setup();
    renderAt('/admin/products/5/edit');
    await screen.findByRole('heading', { name: 'Edit product' });

    const attributes = screen.getByLabelText(/^Attributes/);
    await user.clear(attributes);
    await user.type(attributes, 'size=Large, , =orphan, color=blue');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0].method).toBe('PUT');
    expect(writes[0].url).toMatch(/\/api\/v1\/products\/5$/);
    expect(writes[0].body).toMatchObject({
      items: [expect.objectContaining({ attributes: { size: 'Large', color: 'blue' } })],
    });
  });
});
