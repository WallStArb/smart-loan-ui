# FIS Smart Loan UI

A sophisticated React-based application for automated securities lending parameter management and business logic processing.

## 🚀 Features

### Auto-Loan Rules System
Complete enterprise-grade parameter management for automated securities lending:

#### **Parameter System**
- **Rate Variance Tiers**: Sophisticated tolerance management with AND/OR logic (±BPS, percentage, standard deviation)
- **Revenue Impact Tiers**: Multi-dimensional revenue thresholds (absolute dollar, percentage of loan, daily revenue impact)
- **Availability Strategy Tiers**: Dynamic allocation with base allocation, surge capacity, and soft limits
- **Composite Templates**: Mix-and-match tier combinations with performance analytics
- **Counterparty Assignment**: Direct template assignment with real-time performance tracking

#### **Business Logic Engine**
- **Decision Rules**: Priority-based rules with sophisticated condition-action pairs
- **Compatibility Matrix**: Business rule validation for tier combinations
- **Override Workflows**: Hierarchical approval systems (Manager → Director → VP → C-Level)
- **Decision Analytics**: Real-time processing metrics and rule performance tracking

### Core Dashboards
- **Availability Dashboard**: Securities availability and allocation management
- **Needs Page**: Loan request and requirement tracking
- **Collateral Management**: Collateral tracking and risk assessment
- **Short Sales Dashboard**: Short selling activity and monitoring
- **Borrow/Loan Activity**: Transaction tracking and analysis
- **Automations Dashboard**: Automated process monitoring

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with FIS branding
- **Components**: shadcn/ui component library
- **Icons**: Lucide React
- **State Management**: React hooks with local state

### Component Structure
```
src/components/
├── auto-loan/
│   ├── AutoLoanParameterSystem.tsx    # Parameter tier management
│   └── BusinessLogicEngine.tsx        # Rules and decision engine
├── ui/                                # Reusable UI components
├── dashboards/                        # Core business dashboards
└── shared/                           # Shared utilities and components
```

### Key Features
- **Responsive Design**: Mobile-first approach with density controls
- **Real-Time Analytics**: Live performance metrics and decision tracking
- **Enterprise Security**: Role-based access with audit trails
- **Sophisticated Logic**: AND/OR conditions with multi-factor validation
- **Performance Optimized**: Efficient state management and rendering

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd smart-loan-ui

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 📊 Auto-Loan Rules System

### Parameter System Usage
1. **Tier Management**: Create and manage Rate Variance, Revenue Impact, and Availability Strategy tiers
2. **Template Creation**: Combine tiers into composite templates with business logic validation
3. **Counterparty Assignment**: Assign templates to specific counterparties with performance tracking
4. **Analytics**: Monitor template performance, approval rates, and revenue impact

### Business Logic Engine Usage
1. **Rules Management**: Create priority-based decision rules with sophisticated conditions
2. **Compatibility Matrix**: Define business logic for tier combinations
3. **Override Workflows**: Set up approval hierarchies for exception handling
4. **Decision Analytics**: Track rule performance and decision outcomes

### Data Flow
```
Loan Request → Template Lookup → Rule Evaluation → Decision Engine → 
Override Check → Final Decision → Analytics Update
```

## 🎨 UI/UX Features

### Design System
- **FIS Branding**: Consistent color palette and typography
- **Density Controls**: Compact/Standard/Comfortable viewing modes
- **Responsive Grid**: Adaptive layouts for all screen sizes
- **Interactive Components**: Hover states, transitions, and micro-interactions

### Accessibility
- **WCAG Compliance**: Meets accessibility standards
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **High Contrast**: Accessible color combinations

## 🔧 Configuration

### Environment Variables
```bash
VITE_API_BASE_URL=your_api_url
VITE_APP_TITLE=FIS Smart Loan
```

### Customization
- **Themes**: Modify `tailwind.config.js` for custom styling
- **Components**: Extend shadcn/ui components in `src/components/ui/`
- **Branding**: Update FIS colors and logos in the design system

## 📈 Performance

### Optimization Features
- **Code Splitting**: Dynamic imports for route-based splitting
- **Lazy Loading**: Deferred loading of non-critical components
- **Memoization**: React.memo and useMemo for expensive calculations
- **Bundle Analysis**: Webpack bundle analyzer integration

### Monitoring
- **Real-Time Metrics**: Performance tracking for decision processing
- **Error Boundaries**: Graceful error handling and recovery
- **Analytics Integration**: Built-in performance monitoring

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deployment Platforms
- **Vercel**: Optimized for React applications
- **AWS S3 + CloudFront**: Scalable static hosting
- **Docker**: Containerized deployment option

## 📝 Contributing

### Development Guidelines
1. **TypeScript**: Strict typing for all components and utilities
2. **Component Design**: Reusable, composable component architecture
3. **Testing**: Unit tests for critical business logic
4. **Documentation**: Clear JSDoc comments for complex functions

### Code Style
- **ESLint**: Enforced code quality and consistency
- **Prettier**: Automated code formatting
- **Conventional Commits**: Structured commit messages

## 📄 License

This project is proprietary software developed for FIS Global.

---

**FIS Smart Loan** - Sophisticated automated securities lending platform
