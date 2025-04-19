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
                warehouseGroups[warehouse] = 0;
            }
            warehouseGroups[warehouse] += quantity;
        }

        // Calculate total weight for each warehouse
        const warehouseWeights = {};
        for (const [warehouse, quantity] of Object.entries(warehouseGroups)) {
            warehouseWeights[warehouse] = quantity * PRODUCT_WEIGHT;
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

        // For multiple warehouses, find the optimal route
        let minCost = Infinity;
        let optimalRoute = [];

        // Try each warehouse as starting point
        for (const startWarehouse of warehouses) {
            const remainingWarehouses = warehouses.filter(w => w !== startWarehouse);
            const totalWeight = Object.values(warehouseWeights).reduce((a, b) => a + b, 0);

            // Calculate cost for each possible route
            for (const perm of this._getPermutations(remainingWarehouses)) {
                const route = [startWarehouse, ...perm, 'L1'];
                let cost = 0;
                let currentWeight = totalWeight;

                for (let i = 0; i < route.length - 1; i++) {
                    const from = route[i];
                    const to = route[i + 1];
                    const legWeight = from === 'L1' ? 0 : warehouseWeights[from];
                    cost += this._calculateLegCost(DISTANCES[`${from}-${to}`], currentWeight);
                    currentWeight -= legWeight;
                }

                if (cost < minCost) {
                    minCost = cost;
                    optimalRoute = route;
                }
            }
        }

        return {
            route: optimalRoute.map((w, i) => i < optimalRoute.length - 1 ? `${w}-${optimalRoute[i + 1]}` : null).filter(Boolean),
            cost: minCost
        };
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