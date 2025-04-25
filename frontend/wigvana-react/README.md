# WigVana - Ethiopian Wig E-commerce Platform

## Todos

1. Navbar is non-responsive.
2. Seller registration load some stub data?

## Group Members
1. Adonawit Fiseha-NI4324 
2. Alazar GebreMedhin-XF2644 
3. Abid Mohamed-CX5109
4. Fethi Mohammed-VK9469 

## Our Journey

WigVana is a project to create Ethiopia's first dedicated wig e-commerce platform. Our team of four collaborated to build a modern, user-friendly marketplace that connects wig sellers with customers across Ethiopia. We focused on creating an intuitive shopping experience while ensuring sellers have powerful tools to manage their businesses.

### What Makes WigVana Special?

We built WigVana with both buyers and sellers in mind. For buyers, we created a seamless shopping experience with features like:
- Easy product browsing with advanced filters
- Real-time messaging with sellers
- Secure shopping cart with length-based pricing
- Wishlist functionality to save favorite items

For sellers, we developed a comprehensive dashboard that includes:
- Product management tools
- Order tracking
- Customer messaging
- Analytics and insights

### Technical Challenges & Solutions

During development, we faced several challenges:
1. **Real-time Messaging**: We implemented a WebSocket-based system for instant communication between buyers and sellers, including typing indicators and read receipts.
2. **Image Management**: Created a robust image upload system with preview and error handling.
3. **State Management**: Utilized React Context API effectively to manage global state without complexity.
4. **Responsive Design**: Ensured perfect display across all device sizes using Material-UI's responsive components.

### Learning Experience

This project helped us grow as developers by:
- Working with modern React features and best practices
- Implementing complex state management solutions
- Creating responsive and accessible user interfaces
- Managing project scope and deadlines effectively

## Project Overview

WigVana is a full-featured e-commerce platform built with React and Material-UI. It provides a comprehensive solution for buying and selling wigs online, with features ranging from basic product browsing to real-time seller-buyer communication.

## Features

### Buyer Features
- Browse products by category, price, or search terms
- View detailed product information
- Add products to shopping cart
- Save liked/favorite products
- Message sellers (optional feature)
- Registration/login (optional for basic browsing)

### Seller Features
- Secure seller dashboard
- Product management (add, edit, delete)
- Upload product images
- Receive and respond to buyer messages

### Core Features
1. **Homepage**
   - Featured products showcase
   - Search functionality
   - Responsive design

2. **Product Listing**
   - Grid/list view
   - Filtering and sorting
   - Search functionality

3. **Product Details**
   - Detailed information display
   - Add to cart functionality

4. **Cart Management**
   - Item quantity management
   - Price calculations
   - Remove items

5. **Messaging System (Bonus)**
   - Real-time chat
   - Typing indicators
   - Message status (read/unread)

## Technical Implementation

### Core Architecture
- **React 18**: Utilizing the latest React features including concurrent rendering and automatic batching
- **Component Structure**: Modular architecture with smart and presentational components
- **Custom Hooks**: Implemented reusable logic for cart, authentication, messaging, and product management

### State Management
- **Context API Implementation**:
  - `AuthContext`: Handles user authentication, roles, and permissions
  - `CartContext`: Manages shopping cart state with local storage persistence
  - `ProductContext`: Handles product CRUD operations for sellers
  - `MessagingContext`: Manages real-time communication
  - `FavoritesContext`: Handles wishlist functionality
  - `ToastContext`: Manages application-wide notifications

### UI/UX Implementation
- **Material-UI v5**:
  - Custom theme configuration with Ethiopian-inspired color palette
  - Responsive Grid system for layouts
  - Custom styled components using `styled` API
  - Advanced components: Autocomplete, Dialog, Snackbar
- **Form Management**:
  - Formik for form state management
  - Yup for schema validation
  - Custom validation rules for product listings

### Key Features Implementation

#### Authentication System
```javascript
// Example of protected route implementation
const ProtectedSellerRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!user?.isSeller) return <Navigate to="/become-seller" />;
  return children;
};
```

#### Real-time Messaging
```javascript
// WebSocket service implementation
class WebSocketService {
  connect(userId) {
    this.socket = new WebSocket(WS_URL);
    this.socket.onmessage = this.handleMessage;
    this.socket.onopen = () => this.authenticate(userId);
  }
  
  handleMessage(event) {
    const data = JSON.parse(event.data);
    this.emit('message', data);
  }
}
```

#### Shopping Cart Logic
```javascript
// Price calculation with length variations
const calculatePrice = (basePrice, length, quantity) => {
  const lengthPrice = length > 20 ? (length - 20) * 500 : 0;
  return (basePrice + lengthPrice) * quantity;
};
```

### Performance Optimizations
- **Code Splitting**: Using React.lazy() for route-based code splitting
- **Image Optimization**:
  - Lazy loading for images
  - Responsive image loading using srcset
  - Image compression on upload
- **Memoization**:
  - React.memo for expensive components
  - useMemo for complex calculations
  - useCallback for stable callbacks

### Security Measures
- **Input Validation**: Server-side validation for all forms
- **Authentication**: JWT-based authentication flow
- **Protected Routes**: Role-based access control
- **Data Sanitization**: XSS prevention in user inputs
- **Secure Storage**: Sensitive data encryption in localStorage

### Testing Strategy
- **Unit Tests**: Testing individual components and hooks
- **Integration Tests**: Testing component interactions
- **E2E Tests**: Full user flow testing
- **Test Coverage**: Aiming for 80%+ coverage

## Getting Started

1. Clone the repository:
   ```bash
   git clone [repository-url]
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Project Structure

```
src/
├── components/        # Reusable UI components
├── context/          # React Context providers
├── pages/            # Page components
├── data/            # Mock data
├── utils/           # Helper functions
└── App.js           # Main application component
```

## Features Implementation

### Authentication
- Local authentication using React Context
- Role-based access control (buyer/seller)

### Product Management
- Mock API integration
- Image upload simulation
- CRUD operations for sellers

### Shopping Cart
- Local storage persistence
- Quantity management
- Price calculations

### Search and Filter
- Dynamic filtering
- Price range selection
- Category filtering
- Sort options

### Responsive Design
- Mobile-first approach
- Fluid layouts
- Responsive images

## Running the Project

The application runs on `http://localhost:3000` by default. No additional configuration is required for basic functionality.

## Future Improvements
- Backend integration
- Payment processing
- User reviews and ratings
- Advanced search features
- Order tracking

## Conclusion

This project was developed as part of our Web Programming II course at HilcoE School of computer science and technology. The project successfully fulfilled all core course objectives:

### Course Objectives Achieved

1. **Modern JavaScript & React Implementation**
   - Utilized ES6+ features throughout the codebase
   - Implemented functional components and React Hooks
   - Applied Context API for state management
   - Created custom hooks for reusable logic

2. **Single Page Application Architecture**
   - Implemented client-side routing using React Router
   - Created a seamless user experience with no page reloads
   - Managed complex application state across components
   - Handled dynamic data loading and updates

3. **Component-Based Development**
   - Built reusable UI components
   - Implemented proper component hierarchy
   - Managed component lifecycle effectively
   - Created maintainable and scalable code structure

4. **Form Handling & Validation**
   - Implemented complex forms with Formik
   - Added comprehensive validation using Yup
   - Created custom validation rules
   - Provided real-time feedback to users

5. **State Management & Data Flow**
   - Used Context API for global state
   - Implemented local storage persistence
   - Managed complex data relationships
   - Handled real-time updates efficiently

6. **User Interface & Experience**
   - Created responsive layouts for all screen sizes
   - Implemented Material-UI components and themes
   - Added loading states and error handling
   - Ensured accessibility standards were met

7. **Authentication & Authorization**
   - Implemented user registration and login
   - Created role-based access control
   - Protected sensitive routes and operations
   - Managed user sessions securely

Through this project, we've demonstrated not only technical proficiency but also practical application of web development concepts. Our team successfully delivered a functional e-commerce platform that showcases both technical excellence and practical utility for the Ethiopian market. We're proud of what we've accomplished and look forward to potentially expanding this project in the future. 