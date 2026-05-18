# shadcn/ui Integration Guide for OVA NGO Client

This guide explains how **shadcn/ui** can be used to create a more effective, accessible, and polished UI for the Join and Donate pages.

## What is shadcn/ui?

shadcn/ui is a collection of re-usable components built using **Radix UI** primitives and **Tailwind CSS**. Unlike traditional component libraries, you copy the source code into your project—giving you full control and no black-box dependencies.

### Benefits for OVA NGO

| Current (Bootstrap) | With shadcn/ui |
|--------------------|----------------|
| Generic look | Custom, branded design |
| Limited accessibility | Full keyboard nav, screen reader support |
| Fixed styling | Easy theming with CSS variables |
| Heavy bundle | Tree-shakeable, copy only what you need |

---

## Component Mapping

### Join / Donate Page Components

| Current Element | shadcn Component | Why |
|-----------------|------------------|-----|
| `card card-ova` | `Card` | Consistent padding, header/footer slots |
| `form-control` inputs | `Input` | Focus rings, error states, labels |
| `btn btn-success` | `Button` | Variants (default, outline, ghost), loading states |
| `form-check` checkbox | `Checkbox` | Accessible, animated check |
| `accordion` | `Collapsible` or `Accordion` | Smooth animations, better UX |
| `form-select` | `Select` | Custom styling, searchable option |
| `blockquote` | `Card` with quote styling | Consistent typography |

### Example: Donation Form with shadcn

```tsx
// With shadcn Card, Input, Button, Checkbox
<Card>
  <CardHeader>
    <CardTitle>I wish to feed children</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      {feedOptions.map((opt) => (
        <Button
          key={opt.amount}
          variant={donationAmount === opt.amount ? "default" : "outline"}
          onClick={() => setDonationAmount(opt.amount)}
        >
          ₹{opt.amount.toLocaleString()} to feed {opt.children} children
        </Button>
      ))}
    </div>
    <div className="flex items-center space-x-2 mt-4">
      <Checkbox id="sponsor" checked={sponsorEducation} onCheckedChange={setSponsorEducation} />
      <Label htmlFor="sponsor">I would also like to sponsor a child's education fees starting from ₹200.</Label>
    </div>
    <Button className="mt-4">Pay</Button>
  </CardContent>
</Card>
```

---

## Migration Path

### Option A: Migrate to Vite (Recommended)

shadcn/ui works best with **Vite**. Migrating from CRA to Vite is straightforward:

```bash
# 1. Install Vite and plugins
npm install -D vite @vitejs/plugin-react

# 2. Create vite.config.js
# 3. Update package.json scripts
# 4. Move index.html to root
```

Then run:

```bash
npx shadcn@latest init
npx shadcn@latest add card button input checkbox label select
```

### Option B: Add to Create React App

1. **Install Tailwind** (Tailwind v3 recommended for shadcn):

```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

2. **Configure `tailwind.config.js`**:

```js
content: ["./src/**/*.{js,jsx,ts,tsx}"],
```

3. **Add Tailwind to `src/index.css`**:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

4. **Initialize shadcn**:

```bash
npx shadcn@latest init
```

5. **Add components**:

```bash
npx shadcn@latest add card
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add checkbox
npx shadcn@latest add label
```

### Option C: Use shadcn Patterns with Bootstrap

You can adopt shadcn's **patterns** without installing it:

- **Composition**: Use small, composable components
- **Slots**: Card with CardHeader, CardContent, CardFooter
- **Variants**: Button with `variant` prop (default, outline, ghost)
- **Accessibility**: Add `aria-*` attributes, focus management

---

## Recommended Components for OVA

| Component | Use Case |
|-----------|----------|
| **Card** | 80G info block, donation form, bank details |
| **Button** | Donate, Pay, Become a Volunteer |
| **Input** | Name, email, phone, PAN, amount |
| **Checkbox** | Terms, education sponsorship |
| **Label** | Form labels with proper association |
| **Select** | Citizenship, currency |
| **Accordion** | FAQ section |
| **Alert** | Success/error messages |
| **Separator** | Visual section breaks |

---

## Theming with OVA Colors

shadcn uses CSS variables. Add to your theme:

```css
:root {
  --primary: 142 76% 36%;        /* OVA green #198754 */
  --primary-foreground: 0 0% 100%;
  --secondary: 166 76% 47%;     /* OVA teal #20c997 */
  --accent: 142 76% 95%;        /* Light green #e8f5e9 */
}
```

---

## Next Steps

1. **Short term**: Keep Bootstrap; ensure Join and Donate pages have identical structure (done).
2. **Medium term**: Create a Vite branch and add shadcn for the donation flow.
3. **Long term**: Migrate full app to Vite + shadcn for consistent, accessible UI.

For more: [ui.shadcn.com](https://ui.shadcn.com)
