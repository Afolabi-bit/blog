# Noterverse

A distraction-free reading and publishing platform built with modern web technologies (deployed at [noterverse.vercel.app](https://noterverse.vercel.app)).

## Features

- **User Authentication:** Secure user authentication powered by Kinde. Users can sign up, log in, and manage their accounts.
- **Create and Manage Posts:** Authenticated users can create new blog posts, view their own posts on a personal dashboard, and edit or delete them.
- **Public Feed:** A main feed on the homepage displays the latest posts from all users, making it easy to discover new content.
- **Rich Content:** Posts can include a title, main content, and a cover image.
- **Responsive Design:** The application is fully responsive and works seamlessly on desktops, tablets, and mobile devices.
- **Optimistic UI:** Leverages Next.js features for a fast and smooth user experience, including suspense for loading states.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Authentication:** [Kinde](https://kinde.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js and npm (or yarn)
- A PostgreSQL database

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/Afolabi-bit/blog.git
    ```
2.  **Install NPM packages**
    ```sh
    npm install
    ```
3.  **Set up environment variables**

    Create a `.env` file in the root of your project and add the necessary environment variables. See the [Environment Variables](#environment-variables) section for more details.

4.  **Run database migrations**
    ```sh
    npx prisma db push
    ```
5.  **Run the development server**

    ```sh
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

This project requires the following environment variables to be set in a `.env` file:

- `DATABASE_URL`: The connection string for your PostgreSQL database.
- `KINDE_CLIENT_ID`: Your Kinde client ID.
- `KINDE_CLIENT_SECRET`: Your Kinde client secret.
- `KINDE_ISSUER_URL`: Your Kinde issuer URL.
- `KINDE_SITE_URL`: The URL of your site (e.g., `http://localhost:3000`).
- `KINDE_POST_LOGOUT_REDIRECT_URL`: The URL to redirect to after logout (e.g., `http://localhost:3000`).
- `KINDE_POST_LOGIN_REDIRECT_URL`: The URL to redirect to after login (e.g., `http://localhost:3000/dashboard`).

## License

Distributed under the MIT License. See `LICENSE` for more information.
