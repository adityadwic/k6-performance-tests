# Load Testing Suite - Comprehensive Performance Testing

> Comprehensive k6 performance testing scenarios for contact management API

## 🎯 Overview

This folder contains 7 specialized load testing scenarios designed to thoroughly evaluate system performance under various conditions. Each test simulates real-world usage patterns and provides detailed insights into system behavior.

## 📁 Test Scenarios

### 1. **Smoke Test** (`smoke-test.js`)
- **Purpose**: Basic system validation and health checks
- **Load**: 2 VUs for 1 minute
- **Focus**: API availability, basic functionality, deployment verification
- **When to use**: After deployments, before major testing

```bash
k6 run src/loadtest/smoke-test.js
```

### 2. **Average Load Test** (`average-load-test.js`)
- **Purpose**: Normal operating conditions simulation
- **Load**: Up to 15 VUs for 21 minutes
- **Focus**: Typical user behavior, realistic workflows
- **When to use**: Performance baseline establishment

```bash
k6 run src/loadtest/average-load-test.js
```

### 3. **Stress Test** (`stress-test.js`)
- **Purpose**: Beyond normal capacity testing
- **Load**: Up to 100 VUs for 26 minutes
- **Focus**: Breaking point identification, recovery behavior
- **When to use**: Capacity planning, resilience testing

```bash
k6 run src/loadtest/stress-test.js
```

### 4. **Soak Test** (`soak-test.js`)
- **Purpose**: Long-duration reliability assessment
- **Load**: 25 VUs for 85 minutes
- **Focus**: Memory leaks, performance degradation over time
- **When to use**: Production readiness validation

```bash
k6 run src/loadtest/soak-test.js
```

### 5. **Spike Test** (`spike-test.js`)
- **Purpose**: Sudden massive load simulation
- **Load**: 5→200 VUs instant spike
- **Focus**: Auto-scaling, sudden traffic surge handling
- **When to use**: Testing traffic spikes, viral content scenarios

```bash
k6 run src/loadtest/spike-test.js
```

### 6. **Breakpoint Test** (`breakpoint-test.js`)
- **Purpose**: Gradual capacity limit identification
- **Load**: 10→300 VUs in progressive steps
- **Focus**: Maximum capacity discovery, performance degradation points
- **When to use**: Infrastructure sizing, capacity planning

```bash
k6 run src/loadtest/breakpoint-test.js
```

### 7. **Complex Scenario Test** (`complex-scenario-test.js`)
- **Purpose**: Real-world multi-pattern simulation
- **Load**: 7 concurrent scenarios for 30 minutes
- **Focus**: Business workflows, department-specific patterns, peak/off-peak cycles
- **When to use**: Comprehensive system validation, production simulation

```bash
k6 run src/loadtest/complex-scenario-test.js
```

## 🏗️ Project Architecture

### 📁 Complete File Structure
```
k6-script/
├── package.json                    # Project dependencies
├── package-lock.json              # Dependency lock file  
├── report.json                     # Test execution reports
├── README.md                       # Main project documentation
└── src/
    ├── basic-scenario/             # 📂 Basic Testing Scenarios
    │   ├── create-contact.js       # Contact creation test
    │   ├── ping-stages.js          # 7-stage comprehensive test
    │   ├── register.js             # User registration test
    │   └── scenario.js             # Multi-scenario testing
    ├── helper/                     # 📂 Utility Modules
    │   ├── contact.js              # Contact management utilities
    │   └── user.js                 # User management utilities
    └── loadtest/                   # 📂 Advanced Load Testing Suite
        ├── README.md               # Load testing documentation
        ├── smoke-test.js           # Basic system validation
        ├── average-load-test.js    # Normal operating conditions
        ├── stress-test.js          # Beyond normal capacity
        ├── soak-test.js           # Long-duration reliability
        ├── spike-test.js          # Sudden massive load
        ├── breakpoint-test.js     # Gradual capacity limits
        └── complex-scenario-test.js # Real-world multi-pattern
```

### Core Components
- **User Helper** (`../helper/user.js`): User registration, login, management
- **Contact Helper** (`../helper/contact.js`): Contact creation and management
- **Basic Scenarios** (`../basic-scenario/`): Foundation testing patterns
- **Custom Metrics**: Specialized metrics for each test scenario
- **Realistic Data**: Company/department simulation, varied user types

### Key Features
- ✅ **Professional Documentation**: Comprehensive JSDoc comments
- ✅ **Custom Metrics**: Scenario-specific performance indicators
- ✅ **Realistic Workflows**: Business logic simulation
- ✅ **Error Handling**: Robust error management and reporting
- ✅ **Configurable Thresholds**: Performance criteria validation
- ✅ **Multi-user Types**: Different user behavior patterns

## 📊 Test Execution Guide

### Quick Test Suite
```bash
# 1. Smoke test (1 min) - Quick validation
k6 run src/loadtest/smoke-test.js

# 2. Average load (21 min) - Normal conditions
k6 run src/loadtest/average-load-test.js

# 3. Stress test (26 min) - High load
k6 run src/loadtest/stress-test.js
```

### Extended Test Suite
```bash
# 4. Soak test (85 min) - Long duration
k6 run src/loadtest/soak-test.js

# 5. Spike test (11 min) - Traffic surges
k6 run src/loadtest/spike-test.js

# 6. Breakpoint test (35 min) - Capacity limits
k6 run src/loadtest/breakpoint-test.js
```

### Comprehensive Test
```bash
# 7. Complex scenario (30 min) - Real-world simulation
k6 run src/loadtest/complex-scenario-test.js
```

## 🎯 Test Selection Guide

| Scenario | Use Case | Duration | Complexity | When to Run |
|----------|----------|----------|------------|-------------|
| Smoke | Deployment validation | 1 min | Low | After every deployment |
| Average Load | Performance baseline | 21 min | Medium | Weekly/Monthly |
| Stress | Capacity planning | 26 min | High | Before major releases |
| Soak | Stability validation | 85 min | Medium | Before production |
| Spike | Traffic surge testing | 11 min | High | Pre-marketing campaigns |
| Breakpoint | Infrastructure sizing | 35 min | High | Quarterly planning |
| Complex | Production simulation | 30 min | Very High | Major release cycles |

## 📈 Metrics and Reporting

### Standard k6 Metrics
- **http_req_duration**: Response time analysis
- **http_req_failed**: Error rate monitoring
- **http_reqs**: Request rate tracking
- **vus**: Virtual user utilization

### Custom Metrics (Per Test)
- **Scenario-specific success rates**: Business logic validation
- **Workflow completion rates**: User journey tracking
- **Performance patterns**: Peak/off-peak analysis
- **User behavior metrics**: Department/role-based insights

### Report Generation
```bash
# Generate detailed JSON report
k6 run --out json=test-results.json src/loadtest/[test-name].js

# Generate summary report
k6 run --summary-trend-stats="avg,min,med,max,p(95),p(99)" src/loadtest/[test-name].js
```

## 🚀 Best Practices

### Before Testing
1. **Environment Setup**: Ensure target system is stable
2. **Data Preparation**: Clean test data, baseline state
3. **Resource Monitoring**: Set up system monitoring
4. **Stakeholder Notification**: Inform teams about testing

### During Testing
1. **Monitor System Resources**: CPU, memory, database connections
2. **Watch Application Logs**: Error patterns, warnings
3. **Network Monitoring**: Bandwidth utilization, latency
4. **Real-time Metrics**: k6 dashboard monitoring

### After Testing
1. **Results Analysis**: Compare against thresholds
2. **Performance Trends**: Historical comparison
3. **Issue Documentation**: Performance bottlenecks
4. **Recommendations**: Infrastructure/code improvements

## 🔧 Configuration

### Environment Variables
```bash
export BASE_URL="https://contact.do.my.id"
export TEST_ENV="staging"  # or "production"
```

### Custom Configuration
Each test supports configuration through options object:
- Virtual user scaling
- Duration adjustment
- Threshold modification
- Scenario customization

## 📝 Portfolio Highlights

### Professional Quality
- ✅ **Enterprise-grade scenarios**: Production-ready test patterns
- ✅ **Comprehensive coverage**: All major load testing types
- ✅ **Real-world simulation**: Business workflow modeling
- ✅ **Detailed documentation**: Professional JSDoc standards

### Technical Sophistication
- ✅ **Multi-scenario execution**: Concurrent testing patterns
- ✅ **Custom metrics**: Business-specific KPIs
- ✅ **Advanced workflows**: Department-based user simulation
- ✅ **Error resilience**: Robust error handling and recovery

### Business Intelligence
- ✅ **Performance insights**: Peak/off-peak analysis
- ✅ **Capacity planning**: Infrastructure sizing guidance
- ✅ **User behavior analysis**: Role-based performance patterns
- ✅ **Scalability assessment**: Growth planning support

---

## 📁 Complete Project Structure

```
k6-script/
├── package.json                    # Node.js dependencies
├── package-lock.json              # Dependency lock file
├── report.json                     # Test execution results
├── README.md                       # Main project documentation
└── src/
    ├── basic-scenario/             # 📂 Foundation Testing Patterns
    │   ├── create-contact.js       # Contact creation performance test
    │   ├── ping-stages.js          # Multi-stage comprehensive testing
    │   ├── register.js             # User registration performance test
    │   └── scenario.js             # Combined scenario testing
    ├── helper/                     # 📂 Reusable Utility Modules
    │   ├── contact.js              # Contact management operations
    │   └── user.js                 # User authentication & management
    └── loadtest/                   # 📂 Advanced Load Testing Suite
        ├── README.md               # Comprehensive documentation
        ├── smoke-test.js           # Basic validation (2 VUs, 1 min)
        ├── average-load-test.js    # Normal conditions (15 VUs, 21 min)
        ├── stress-test.js          # High load testing (100 VUs, 26 min)
        ├── soak-test.js           # Long duration test (25 VUs, 85 min)
        ├── spike-test.js          # Traffic surge test (5→200 VUs)
        ├── breakpoint-test.js     # Capacity limits (10→300 VUs)
        └── complex-scenario-test.js # Multi-pattern simulation (7 scenarios)
```

### 🎯 Testing Workflow Integration

#### Basic Testing (Foundation)
```bash
# Start with basic scenarios
cd k6-script
k6 run src/basic-scenario/register.js        # User registration flow
k6 run src/basic-scenario/create-contact.js  # Contact creation flow
k6 run src/basic-scenario/scenario.js        # Combined workflows
k6 run src/basic-scenario/ping-stages.js     # 7-stage comprehensive
```

#### Advanced Load Testing (Production-Ready)
```bash
# Execute specialized load tests
k6 run src/loadtest/smoke-test.js            # Quick validation
k6 run src/loadtest/average-load-test.js     # Normal conditions
k6 run src/loadtest/stress-test.js           # High load testing
k6 run src/loadtest/complex-scenario-test.js # Real-world simulation
```

---

## 🏆 Test Suite Summary

This comprehensive load testing suite provides:
- **7 specialized test scenarios** covering all major performance testing patterns
- **Professional documentation** with detailed explanations and usage guides
- **Real-world simulation** with business logic and user behavior modeling
- **Enterprise-grade quality** suitable for production environments
- **Portfolio-ready presentation** demonstrating advanced performance testing skills

Perfect for demonstrating expertise in:
- k6 performance testing framework
- Load testing methodology
- Performance engineering
- Business workflow simulation
- Production system validation

---

*Created by Aditya Dwi Cahyono | Professional Performance Testing Portfolio*
