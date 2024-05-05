# 指定生成文件夹的数量
NUM_FOLDERS=10

# 指定保存文件夹的目录
OUTPUT_DIR="./"

# 循环生成 UUID 并创建对应的文件夹
for ((i=1; i<=$NUM_FOLDERS; i++)); do
    # 生成 UUID
    UUID=$(uuidgen)
    
    # 创建文件夹
    mkdir -p "$OUTPUT_DIR$UUID"
done

echo "Folders created successfully."
