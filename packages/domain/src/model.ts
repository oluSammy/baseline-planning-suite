declare const brand: unique symbol;
type Brand<T, Name extends string> = T & { readonly [brand]: Name };

export type EmployeeId = Brand<string, "EmployeeId">;
export type RateRecordId = Brand<string, "RateRecordId">;
export type ProjectId = Brand<string, "ProjectId">;
export type BreakdownItemId = Brand<string, "BreakdownItemId">;
export type AllocationId = Brand<string, "AllocationId">;


// calendar day YYYY-MM-DD
export type ISODate = Brand<string, "ISODate">;

// calendar month YYYY-MM
export type Month = Brand<string, "Month">;

export type PersonMonths = Brand<number, "PersonMonths">;

// cost per hour in Euro
export type HourlyCost = Brand<number, "HourlyCost">;

// Entities

export type WeeklyHours = 40 | 32 | 20

export interface Employee {
    readonly id: EmployeeId;
    readonly name: string;
    readonly role: string;
    readonly weeklyHours: WeeklyHours;
}

export interface RateRecord {
    readonly id: RateRecordId;
    readonly employeeId: EmployeeId;
    readonly validFrom: ISODate;
    readonly hourlyCost: HourlyCost;
}

export interface Project {
    readonly id: ProjectId;
    readonly name: string;
    readonly startDate: ISODate;
    readonly endDate: ISODate;
}

export interface BreakdownItem {
    readonly id: BreakdownItemId;
    readonly projectId: ProjectId;
    readonly parentId: BreakdownItemId | null; // parent is null at the root level
    readonly name: string;
}

export interface Allocation {
    readonly id: AllocationId;
    readonly breakdownItemId: BreakdownItemId;
    readonly employeeId: EmployeeId;
    readonly month: Month;
    readonly amount: PersonMonths;
}

export type * from "./model"