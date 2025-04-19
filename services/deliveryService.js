// const { WAREHOUSES, DISTANCES, PRODUCT_WEIGHT, COST_PER_KM_PER_KG } = require('../utils/constants');

// class DeliveryService {
//     constructor() {
//         this.warehouseProducts = this._createWarehouseProductMap();
//     }

//     _createWarehouseProductMap() {
//         const map = {};
//         for (const [warehouse, products] of Object.entries(WAREHOUSES)) {
//             products.forEach(product => {
//                 map[product] = warehouse;
//             });
//         }
//         return map;
//     }

//     _getWarehouseForProduct(product) {
//         return this.warehouseProducts[product];
//     }

//     _calculateLegCost(distance, weight) {
//         return distance * weight * COST_PER_KM_PER_KG;
//     }

//     _getOptimalRoute(order) {
//         // Group products by warehouse
//         const warehouseGroups = {};
//         for (const [product, quantity] of Object.entries(order)) {
//             const warehouse = this._getWarehouseForProduct(product);
//             if (!warehouseGroups[warehouse]) {
//                 warehouseGroups[warehouse] = 0;
//             }
//             warehouseGroups[warehouse] += quantity;
//         }

//         // Calculate total weight for each warehouse
//         const warehouseWeights = {};
//         for (const [warehouse, quantity] of Object.entries(warehouseGroups)) {
//             warehouseWeights[warehouse] = quantity * PRODUCT_WEIGHT;
//         }

//         // If only one warehouse is needed, return direct route
//         const warehouses = Object.keys(warehouseGroups);
//         if (warehouses.length === 1) {
//             const warehouse = warehouses[0];
//             return {
//                 route: [`${warehouse}-L1`],
//                 cost: this._calculateLegCost(DISTANCES[`${warehouse}-L1`], warehouseWeights[warehouse])
//             };
//         }

//         // For multiple warehouses, find the optimal route
//         let minCost = Infinity;
//         let optimalRoute = [];

//         // Try each warehouse as starting point
//         for (const startWarehouse of warehouses) {
//             const remainingWarehouses = warehouses.filter(w => w !== startWarehouse);
//             const totalWeight = Object.values(warehouseWeights).reduce((a, b) => a + b, 0);

//             // Calculate cost for each possible route
//             for (const perm of this._getPermutations(remainingWarehouses)) {
//                 const route = [startWarehouse, ...perm, 'L1'];
//                 let cost = 0;
//                 let currentWeight = totalWeight;

//                 for (let i = 0; i < route.length - 1; i++) {
//                     const from = route[i];
//                     const to = route[i + 1];
//                     const legWeight = from === 'L1' ? 0 : warehouseWeights[from];
//                     cost += this._calculateLegCost(DISTANCES[`${from}-${to}`], currentWeight);
//                     currentWeight -= legWeight;
//                 }

//                 if (cost < minCost) {
//                     minCost = cost;
//                     optimalRoute = route;
//                 }
//             }
//         }

//         return {
//             route: optimalRoute.map((w, i) => i < optimalRoute.length - 1 ? `${w}-${optimalRoute[i + 1]}` : null).filter(Boolean),
//             cost: minCost
//         };
//     }

//     _getPermutations(arr) {
//         if (arr.length <= 1) return [arr];
//         const result = [];
//         for (let i = 0; i < arr.length; i++) {
//             const current = arr[i];
//             const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
//             const remainingPerms = this._getPermutations(remaining);
//             for (const perm of remainingPerms) {
//                 result.push([current, ...perm]);
//             }
//         }
//         return result;
//     }

//     calculateMinimumCost(order) {
//         const { cost } = this._getOptimalRoute(order);
//         return Math.round(cost);
//     }
// }

// module.exports = new DeliveryService(); 
const { WAREHOUSES, DISTANCES, PRODUCT_WEIGHT, COST_PER_KM_PER_KG } = require('../utils/constants');

class DeliveryService {
    constructor() {
        this.warehouseProducts = this._createWarehouseProductMap();
    }

    _createWarehouseProductMap() {
        const map = {};
        for (const [warehouse, products] of Object.entries(WAREHOUSES)) {
            products.forEach(product => {
                map[product] = warehouse;
            });
        }
        return map;
    }

    _getWarehouseForProduct(product) {
        return this.warehouseProducts[product];
    }

    _calculateLegCost(distance, weight) {
        return distance * weight * COST_PER_KM_PER_KG;
    }

    _getOptimalRoute(order) {
        // Group products by warehouse
        const warehouseGroups = {};
        for (const [product, quantity] of Object.entries(order)) {
            const warehouse = this._getWarehouseForProduct(product);
            if (!warehouseGroups[warehouse]) {
                warehouseGroups[warehouse] = {};
            }
            if (!warehouseGroups[warehouse][product]) {
                warehouseGroups[warehouse][product] = 0;
            }
            warehouseGroups[warehouse][product] += quantity;
        }

        // Calculate total weight for each warehouse
        const warehouseWeights = {};
        for (const [warehouse, products] of Object.entries(warehouseGroups)) {
            warehouseWeights[warehouse] = Object.values(products).reduce((sum, qty) => sum + qty, 0) * PRODUCT_WEIGHT;
        }

        // If only one warehouse is needed, return direct route
        const warehouses = Object.keys(warehouseGroups);
        if (warehouses.length === 1) {
            const warehouse = warehouses[0];
            return {
                route: [`${warehouse}-L1`],
                cost: this._calculateLegCost(DISTANCES[`${warehouse}-L1`], warehouseWeights[warehouse])
            };
        }

        // For multiple warehouses, we need to consider various delivery strategies
        return this._findBestDeliveryStrategy(warehouses, warehouseWeights);
    }

    _findBestDeliveryStrategy(warehouses, warehouseWeights) {
        let bestCost = Infinity;
        let bestRoute = [];

        // Try each warehouse as starting point
        for (const startWarehouse of warehouses) {
            const remainingWarehouses = warehouses.filter(w => w !== startWarehouse);
            
            // Strategy 1: Visit all warehouses first, then deliver to L1 once
            const strategy1 = this._calculateAllWarehousesThenL1(startWarehouse, remainingWarehouses, warehouseWeights);
            if (strategy1.cost < bestCost) {
                bestCost = strategy1.cost;
                bestRoute = strategy1.route;
            }

            // Strategy 2: After each warehouse visit, decide whether to go to L1 or next warehouse
            const strategy2 = this._calculateIntermediateL1Visits(startWarehouse, remainingWarehouses, warehouseWeights);
            if (strategy2.cost < bestCost) {
                bestCost = strategy2.cost;
                bestRoute = strategy2.route;
            }
        }

        return {
            route: bestRoute,
            cost: bestCost
        };
    }

    _calculateAllWarehousesThenL1(startWarehouse, remainingWarehouses, warehouseWeights) {
        let minCost = Infinity;
        let optimalRoute = [];
        const totalWeight = Object.values(warehouseWeights).reduce((a, b) => a + b, 0);

        // Calculate cost for all permutations of remaining warehouses
        for (const perm of this._getPermutations(remainingWarehouses)) {
            const route = [startWarehouse, ...perm, 'L1'];
            const routeSegments = [];
            let cost = 0;
            let currentWeight = totalWeight;

            for (let i = 0; i < route.length - 1; i++) {
                const from = route[i];
                const to = route[i + 1];
                const legKey = `${from}-${to}`;
                
                if (!DISTANCES[legKey]) {
                    console.error(`Missing distance for ${legKey}`);
                    continue;
                }
                
                cost += this._calculateLegCost(DISTANCES[legKey], currentWeight);
                routeSegments.push(legKey);
                
                // Reduce weight only if we're not at L1 yet
                if (to !== 'L1') {
                    currentWeight -= warehouseWeights[from];
                }
            }

            if (cost < minCost) {
                minCost = cost;
                optimalRoute = routeSegments;
            }
        }

        return {
            route: optimalRoute,
            cost: minCost
        };
    }

    _calculateIntermediateL1Visits(startWarehouse, remainingWarehouses, warehouseWeights) {
        // This strategy allows for visiting L1 between warehouse visits
        // We'll use dynamic programming to find the best route
        
        // First, get all possible orderings of the warehouses
        const allWarehousePermutations = this._getPermutations([startWarehouse, ...remainingWarehouses]);
        
        let bestCost = Infinity;
        let bestRoute = [];
        
        for (const warehouseOrder of allWarehousePermutations) {
            // For each warehouse, we have a choice: go to next warehouse or go to L1 first
            const possibleRoutes = this._generateAllPossibleRoutes(warehouseOrder);
            
            for (const route of possibleRoutes) {
                const { cost, segments } = this._calculateRouteCost(route, warehouseWeights);
                
                if (cost < bestCost) {
                    bestCost = cost;
                    bestRoute = segments;
                }
            }
        }
        
        return {
            route: bestRoute,
            cost: bestCost
        };
    }
    
    _generateAllPossibleRoutes(warehouseOrder) {
        // Base case: always need to end at L1
        if (warehouseOrder.length === 1) {
            return [[warehouseOrder[0], 'L1']];
        }
        
        const routes = [];
        const firstWarehouse = warehouseOrder[0];
        const remainingWarehouses = warehouseOrder.slice(1);
        
        // Option 1: Go directly to next warehouse
        const subRoutes1 = this._generateAllPossibleRoutes(remainingWarehouses);
        for (const subRoute of subRoutes1) {
            routes.push([firstWarehouse, ...subRoute]);
        }
        
        // Option 2: Go to L1 first, then to next warehouse
        const subRoutes2 = this._generateAllPossibleRoutes(remainingWarehouses);
        for (const subRoute of subRoutes2) {
            routes.push([firstWarehouse, 'L1', ...subRoute]);
        }
        
        return routes;
    }
    
    _calculateRouteCost(route, warehouseWeights) {
        let cost = 0;
        const segments = [];
        let currentWarehouseWeights = { ...warehouseWeights };
        
        for (let i = 0; i < route.length - 1; i++) {
            const from = route[i];
            const to = route[i + 1];
            const legKey = `${from}-${to}`;
            
            if (!DISTANCES[legKey]) {
                console.error(`Missing distance for ${legKey}`);
                continue;
            }
            
            // Calculate current total weight being carried
            let currentWeight = 0;
            if (from !== 'L1') {
                for (const warehouse in currentWarehouseWeights) {
                    if (warehouse === from || 
                        (from !== 'L1' && i > 0 && route.slice(0, i).includes(warehouse) && !route.slice(0, i).includes('L1'))) {
                        // We've picked up this warehouse's products but haven't visited L1 yet
                        currentWeight += currentWarehouseWeights[warehouse];
                    }
                }
            }
            
            cost += this._calculateLegCost(DISTANCES[legKey], currentWeight);
            segments.push(legKey);
            
            // If we just arrived at L1, mark all previous warehouses as delivered
            if (to === 'L1') {
                for (let j = 0; j <= i; j++) {
                    const visitedWarehouse = route[j];
                    if (visitedWarehouse !== 'L1') {
                        delete currentWarehouseWeights[visitedWarehouse];
                    }
                }
            }
        }
        
        return { cost, segments };
    }

    _getPermutations(arr) {
        if (arr.length <= 1) return [arr];
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const current = arr[i];
            const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const remainingPerms = this._getPermutations(remaining);
            for (const perm of remainingPerms) {
                result.push([current, ...perm]);
            }
        }
        return result;
    }

    calculateMinimumCost(order) {
        const { cost } = this._getOptimalRoute(order);
        return Math.round(cost);
    }
}

module.exports = new DeliveryService();