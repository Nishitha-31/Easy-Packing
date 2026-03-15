#include <stdio.h>

#define MAX_ITEMS 20

typedef struct {
    int w, b, h;
    int volume;
} Item;

typedef struct {
    int x1, y1, z1;
    int x2, y2, z2;
} Placement;

Item items[MAX_ITEMS];

Placement currentPlacement[MAX_ITEMS];
Placement bestPlacement[MAX_ITEMS];

int suitcaseW, suitcaseB, suitcaseH;
int totalItems;

int maxPacked = 0;

// Sort items by volume (descending)
void sortItems() {

    for (int i = 0; i < totalItems - 1; i++) {
        for (int j = i + 1; j < totalItems; j++) {

            if (items[i].volume < items[j].volume) {

                Item temp = items[i];
                items[i] = items[j];
                items[j] = temp;
            }
        }
    }
}

// Overlap check
int isOverlap(Placement a, Placement b) {

    if (a.x1 >= b.x2 || a.x2 <= b.x1)
        return 0;

    if (a.y1 >= b.y2 || a.y2 <= b.y1)
        return 0;

    if (a.z1 >= b.z2 || a.z2 <= b.z1)
        return 0;

    return 1;
}

// Collision check
int checkCollision(int placedCount, Placement newBox) {

    for (int i = 0; i < placedCount; i++) {

        if (isOverlap(currentPlacement[i], newBox))
            return 1;
    }

    return 0;
}

// Backtracking
void packItems(int itemIndex, int packedCount) {

    // Update best result
    if (packedCount > maxPacked) {

        maxPacked = packedCount;

        for (int i = 0; i < packedCount; i++)
            bestPlacement[i] = currentPlacement[i];
    }

    // Stop condition
    if (itemIndex >= totalItems)
        return;

    // PRUNING
    if (packedCount + (totalItems - itemIndex) <= maxPacked)
        return;

    int rotations[6][3] = {
        {items[itemIndex].w, items[itemIndex].b, items[itemIndex].h},
        {items[itemIndex].w, items[itemIndex].h, items[itemIndex].b},
        {items[itemIndex].b, items[itemIndex].w, items[itemIndex].h},
        {items[itemIndex].b, items[itemIndex].h, items[itemIndex].w},
        {items[itemIndex].h, items[itemIndex].w, items[itemIndex].b},
        {items[itemIndex].h, items[itemIndex].b, items[itemIndex].w}
    };

    for (int r = 0; r < 6; r++) {

        int w = rotations[r][0];
        int b = rotations[r][1];
        int h = rotations[r][2];

        for (int x = 0; x <= suitcaseW - w; x++) {
            for (int y = 0; y <= suitcaseB - b; y++) {
                for (int z = 0; z <= suitcaseH - h; z++) {

                    Placement newBox;

                    newBox.x1 = x;
                    newBox.y1 = y;
                    newBox.z1 = z;

                    newBox.x2 = x + w;
                    newBox.y2 = y + b;
                    newBox.z2 = z + h;

                    if (!checkCollision(packedCount, newBox)) {

                        currentPlacement[packedCount] = newBox;

                        packItems(itemIndex + 1, packedCount + 1);
                    }
                }
            }
        }
    }

    // Skip item
    packItems(itemIndex + 1, packedCount);
}

int main() {

    printf("Enter suitcase dimensions (width breadth height): ");
    scanf("%d %d %d", &suitcaseW, &suitcaseB, &suitcaseH);

    printf("Enter number of items: ");
    scanf("%d", &totalItems);

    for (int i = 0; i < totalItems; i++) {

        printf("Enter dimensions of item %d (width breadth height): ", i + 1);
        scanf("%d %d %d", &items[i].w, &items[i].b, &items[i].h);

        items[i].volume = items[i].w * items[i].b * items[i].h;
    }

    sortItems();

    packItems(0, 0);

    printf("\nMaximum items packed: %d\n", maxPacked);

    for (int i = 0; i < maxPacked; i++) {

        printf("\nItem %d\n", i + 1);

        printf("Bottom-front-left: (%d, %d, %d)\n",
               bestPlacement[i].x1,
               bestPlacement[i].y1,
               bestPlacement[i].z1);

        printf("Top-back-right: (%d, %d, %d)\n",
               bestPlacement[i].x2,
               bestPlacement[i].y2,
               bestPlacement[i].z2);
    }

    return 0;
}
