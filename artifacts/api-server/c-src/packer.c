#include <stdio.h>

#define MAX_ITEMS 20

int suitcaseWidth, suitcaseBreadth, suitcaseHeight;
int totalItems;

typedef struct {
    int width;
    int breadth;
    int height;
} Item;

typedef struct {
    int x, y, z;
    int width, breadth, height;
    int itemIndex;
} Placement;

Item itemList[MAX_ITEMS];
Placement placedItems[MAX_ITEMS];
Placement bestArrangement[MAX_ITEMS];

int currentItemCount = 0;
int bestItemCount = 0;

int fitsInsideSuitcase(int x, int y, int z, Item item) {
    if (x + item.width > suitcaseWidth) return 0;
    if (y + item.breadth > suitcaseBreadth) return 0;
    if (z + item.height > suitcaseHeight) return 0;
    return 1;
}

int itemsOverlap(Placement a, Placement b) {
    if (a.x >= b.x + b.width || b.x >= a.x + a.width)
        return 0;
    if (a.y >= b.y + b.breadth || b.y >= a.y + a.breadth)
        return 0;
    if (a.z >= b.z + b.height || b.z >= a.z + a.height)
        return 0;
    return 1;
}

int validPlacement(Placement newPlacement) {
    for (int i = 0; i < currentItemCount; i++) {
        if (itemsOverlap(newPlacement, placedItems[i]))
            return 0;
    }
    return 1;
}

void generateRotations(Item item, Item rotations[6]) {
    rotations[0] = (Item){item.width, item.breadth, item.height};
    rotations[1] = (Item){item.width, item.height, item.breadth};
    rotations[2] = (Item){item.breadth, item.width, item.height};
    rotations[3] = (Item){item.breadth, item.height, item.width};
    rotations[4] = (Item){item.height, item.width, item.breadth};
    rotations[5] = (Item){item.height, item.breadth, item.width};
}

void packItems(int itemIndex) {
    if (itemIndex == totalItems) {
        if (currentItemCount > bestItemCount) {
            bestItemCount = currentItemCount;
            for (int i = 0; i < currentItemCount; i++)
                bestArrangement[i] = placedItems[i];
        }
        return;
    }

    int remainingItems = totalItems - itemIndex;
    if (currentItemCount + remainingItems <= bestItemCount)
        return;

    Item rotations[6];
    generateRotations(itemList[itemIndex], rotations);

    for (int r = 0; r < 6; r++) {
        Item rotatedItem = rotations[r];
        for (int x = 0; x <= suitcaseWidth; x++) {
            for (int y = 0; y <= suitcaseBreadth; y++) {
                for (int z = 0; z <= suitcaseHeight; z++) {
                    if (!fitsInsideSuitcase(x, y, z, rotatedItem))
                        continue;
                    Placement newPlacement;
                    newPlacement.x = x;
                    newPlacement.y = y;
                    newPlacement.z = z;
                    newPlacement.width = rotatedItem.width;
                    newPlacement.breadth = rotatedItem.breadth;
                    newPlacement.height = rotatedItem.height;
                    newPlacement.itemIndex = itemIndex;
                    if (!validPlacement(newPlacement))
                        continue;
                    placedItems[currentItemCount] = newPlacement;
                    currentItemCount++;
                    packItems(itemIndex + 1);
                    currentItemCount--;
                }
            }
        }
    }

    packItems(itemIndex + 1);
}

int main() {
    scanf("%d %d %d", &suitcaseWidth, &suitcaseBreadth, &suitcaseHeight);
    scanf("%d", &totalItems);
    for (int i = 0; i < totalItems; i++) {
        scanf("%d %d %d", &itemList[i].width, &itemList[i].breadth, &itemList[i].height);
    }
    packItems(0);

    printf("%d\n", bestItemCount);
    for (int i = 0; i < bestItemCount; i++) {
        Placement p = bestArrangement[i];
        printf("%d %d %d %d %d %d %d %d %d %d\n",
               p.itemIndex + 1,
               p.x, p.y, p.z,
               p.x + p.width, p.y + p.breadth, p.z + p.height,
               p.width, p.breadth, p.height);
    }
    return 0;
}
